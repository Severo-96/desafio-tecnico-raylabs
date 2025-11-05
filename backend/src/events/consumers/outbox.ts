import { getUnpublishedEvents, markAsPublished } from '../outbox.js';
import { publishEnvelope } from '../producer.js';

async function processOutbox() {
  while (true) {
    try {
      const events = await getUnpublishedEvents(10);

      if (events.length === 0) {
        await new Promise(resolve => setTimeout(resolve, 10000)); // 10s
        continue;
      }

      for (const event of events) {
        try {
          const envelope: any = typeof event.data === 'string' 
            ? JSON.parse(event.data) 
            : event.data;

          await publishEnvelope(event.stream, envelope);
          await markAsPublished(event.id);

          console.log(`[Outbox] Published event ${event.id} to stream ${event.stream}`);
        } catch (error) {
          console.error(`[Outbox] Failed to publish event ${event.id}:`, error);
        }
      }
    } catch (error) {
      console.error('[Outbox] Error processing outbox:', error);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}

async function startOutboxProcessor() {
  console.log('[Outbox] Starting outbox processor...');
  await processOutbox();
}

// Execute only if not in test mode
if (process.env.NODE_ENV !== 'test') {
  startOutboxProcessor().catch((error) => {
    console.error('[Outbox] Fatal error in outbox processor:', error);
    process.exit(1);
  });
}

