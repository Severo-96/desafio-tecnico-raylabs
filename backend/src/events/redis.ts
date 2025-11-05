import { createClient, type RedisClientType } from "redis";

let client: RedisClientType | null = null;

export async function getRedis(): Promise<RedisClientType> {
  if (!client) {
    client = createClient({ url: process.env.REDIS_URL || "redis://localhost:6379" });
    client.on("error", (err) => console.error("Redis error:", err));
    await client.connect();
  }
  return client;
}

export async function streamAdd(stream: string, fields: Record<string, string>) {
  const redis = await getRedis();
  return redis.xAdd(stream, "*", fields);
}

export async function ensureGroup(stream: string, group: string) {
  const redis = await getRedis();
  try {
    await redis.xGroupCreate(stream, group, "0", { MKSTREAM: true });
  } catch (e: any) {
    if (!String(e?.message || "").includes("BUSYGROUP")) throw e;
  }
}

export async function closeRedis() {
  if (client) {
    await client.quit();
    client = null;
  }
}

// Dead Letter Queue (DLQ)
export async function sendToDLQ(stream: string, originalMessage: any, error: any, attempts: number) {
  const redis = await getRedis();
  const dlqStream = `${stream}:dlq`;
  
  // Serialize the original message preserving all fields
  const dlqFields: Record<string, string> = {
    original_stream: stream,
    original_id: originalMessage.id || '',
    error: String(error),
    error_message: error?.message || String(error),
    attempts: String(attempts),
    failed_at: new Date().toISOString(),
  };

  // Preserve all original message fields
  for (const [key, value] of Object.entries(originalMessage)) {
    if (key !== 'id' && typeof value === 'string') {
      dlqFields[`original_${key}`] = value;
    } else if (typeof value !== 'string') {
      dlqFields[`original_${key}`] = JSON.stringify(value);
    }
  }
  
  return redis.xAdd(dlqStream, "*", dlqFields);
}
