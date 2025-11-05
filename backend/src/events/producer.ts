import { streamAdd } from './redis.js';
import { saveToOutbox } from './outbox.js';
import type { TxClient } from '../infra/transaction.js';

export type EventEnvelope<T = unknown> = {
  type: string;
  version?: number;
  at?: string;
  data: T;
};

export async function publish<T>(stream: string, event: EventEnvelope<T>) {
  const envelope: EventEnvelope<T> = {
    version: 1,
    at: new Date().toISOString(),
    ...event,
  };

  return streamAdd(stream, {
    type: envelope.type,
    version: String(envelope.version ?? 1),
    at: envelope.at!,
    data: JSON.stringify(envelope.data),
  });
}

export async function publishToOutbox<T>(
  tx: TxClient,
  stream: string,
  event: EventEnvelope<T>
): Promise<string> {
  return saveToOutbox(tx, stream, event);
}

export async function publishEnvelope(stream: string, envelope: EventEnvelope) {
  return streamAdd(stream, {
    type: envelope.type,
    version: String(envelope.version ?? 1),
    at: envelope.at!,
    data: JSON.stringify(envelope.data),
  });
}
