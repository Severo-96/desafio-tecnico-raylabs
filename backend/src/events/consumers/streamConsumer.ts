import { ensureGroup, getRedis, sendToDLQ } from '../redis.js';

export type ConsumerOptions = {
  stream: string;
  group: string;
  consumer: string;
  handler: (data: any, id: string) => Promise<void> | void;
  maxRetries?: number; // Maximum number of retries before sending to DLQ (default: 3)
};

// Get delivery count of a message using XPENDING
async function getDeliveryCount(
  redis: any,
  stream: string,
  group: string,
  messageId: string
): Promise<number> {
  try {
    const pendingInfo = await redis.xPending(
      stream,
      group,
      messageId,
      messageId,
      1 // count: returns only 1 entry
    );
    
    if (pendingInfo && Array.isArray(pendingInfo) && pendingInfo.length > 0) {
      const deliveryCount = pendingInfo[0]?.[3] || 0;
      return deliveryCount;
    }
    
    return 0;
  } catch (e) {
    console.warn(`[${stream}] Could not get pending info for ${messageId}`);
    return 0;
  }
}

// Process a message with retry based on delivery count
async function processMessage(
  redis: any,
  stream: string,
  group: string,
  message: any,
  handler: (data: any, id: string) => Promise<void> | void,
  maxRetries: number
): Promise<void> {
  const id = message.id;
  const map = message.message as any;
  const data = map.data ? JSON.parse(map.data) : {};

  try {
    // Execute the handler (function that processes the message)
    // If successful, acknowledge the message (ACK) and return
    await handler(data, id);
    await redis.xAck(stream, group, id);
    console.log(`[${stream}] Successfully processed message id:${id}`);
  } catch (error) {
    // Get how many times this message has been attempted
    const deliveryCount = await getDeliveryCount(redis, stream, group, id);
    const nextAttempt = deliveryCount + 1;
    
    if (nextAttempt < maxRetries) {
      console.error(
        `[${stream}] Error processing message id:${id}, attempt ${nextAttempt}/${maxRetries}. Will retry:`,
        error
      );
    } else {
      console.error(
        `[${stream}] Max retries (${maxRetries}) reached for message id:${id}. Sending to DLQ:`,
        error
      );
      
      await sendToDLQ(stream, { ...map, id }, error, nextAttempt);
      await redis.xAck(stream, group, id);
    }
  }
}

export async function runStreamConsumer(opts: ConsumerOptions) {
  const { stream, group, consumer, handler, maxRetries = 3 } = opts;
  const redis = await getRedis();

  await ensureGroup(stream, group);

  console.log(`[${stream}] Starting consumer with maxRetries=${maxRetries}`);

  while (true) {
    // Process pending messages from this consumer
    try {
      // To get specific pending messages, we need to use XREADGROUP with ID "0"
      const pendingReply = await redis.xReadGroup(
        group,
        consumer,
        { key: stream, id: "0" }, // ID "0" reads pending messages
        { COUNT: 10 }
      );

      if (pendingReply) {
        for (const { messages } of pendingReply) {
          for (const message of messages) {
            await processMessage(redis, stream, group, message, handler, maxRetries);
          }
        }
      }
    } catch (e: any) {
      // If there are no pending messages or another error, continue
      const errorMsg = String(e?.message || e || '');
      if (errorMsg.includes("NOGROUP")) {
        await ensureGroup(stream, group);
      }
    }

    // Then, process new messages
    const reply = await redis.xReadGroup(
      group,
      consumer,
      { key: stream, id: ">" },
      { COUNT: 10, BLOCK: 5000 }
    );

    if (reply) {
      for (const { messages } of reply) {
        for (const message of messages) {
          await processMessage(redis, stream, group, message, handler, maxRetries);
        }
      }
    }
  }
}

// Start consumer only if not in test mode
export function startConsumer(opts: ConsumerOptions) {
  if (process.env.NODE_ENV !== 'test') {
    runStreamConsumer(opts).catch(console.error);
  }
}
