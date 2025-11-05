import type { TxClient } from '../infra/transaction.js';
import type { EventEnvelope } from './producer.js';
import { db } from '../infra/database.js';

export type OutboxEvent = {
  id: string;
  stream: string;
  type: string;
  version: number;
  data: any;
  created_at: string;
};

export async function saveToOutbox<T>(tx: TxClient, stream: string, event: EventEnvelope<T>): Promise<string> {
  const envelope: EventEnvelope<T> = {
    version: 1,
    at: new Date().toISOString(),
    ...event,
  };

  const { rows } = await tx.query<{ id: string }>(
    `INSERT INTO outbox (stream, type, version, data)
     VALUES ($1, $2, $3, $4::jsonb)
     RETURNING id`,
    [
      stream,
      envelope.type,
      envelope.version ?? 1,
      JSON.stringify(envelope),
    ]
  );

  return rows[0]!.id;
}

export async function getUnpublishedEvents(
  limit: number = 100
): Promise<OutboxEvent[]> {
  const { rows } = await db.query<OutboxEvent>(
    `SELECT id, stream, type, version, data, created_at
     FROM outbox
     WHERE published = FALSE
     ORDER BY created_at ASC, id ASC
     LIMIT $1
     FOR UPDATE SKIP LOCKED`,
    [limit]
  );
  return rows;
}

export async function markAsPublished(id: string): Promise<void> {
  await db.query(
    `UPDATE outbox
     SET published = TRUE, published_at = NOW()
     WHERE id = $1`,
    [id]
  );
}
