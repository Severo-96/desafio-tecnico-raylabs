import { Pool } from 'pg';
import dotenv from 'dotenv';
import { runMigrations } from './migrations.js';

if (process.env.NODE_ENV === 'test') {
  dotenv.config({ path: '.env.test', override: true });
} else {
  dotenv.config({ path: '.env', override: false });
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is not set');
}
export const db = new Pool({ connectionString: databaseUrl });

export async function initDb() {
  try {
    await db.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);
  } catch (e) {
    console.warn('pgcrypto not created, error:', e);
    console.warn('test environment:', process.env.NODE_ENV);
  }

  await runMigrations();
}

export async function truncateAll() {
  const { rows } = await db.query(`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename NOT IN ('spatial_ref_sys', 'migrations')
  `);
  for (const { tablename } of rows) {
    await db.query(`TRUNCATE TABLE "${tablename}" RESTART IDENTITY CASCADE;`);
  }
}

export async function closeDb() {
  await db.end();
}

export async function createDatabaseIfNotExists(databaseName: string) {
  // Connect to 'postgres' database to create the target database
  const url = databaseUrl!;
  const adminUrl = url.replace(/\/([^\/]+)$/, '/postgres');
  const adminPool = new Pool({ connectionString: adminUrl });

  try {
    const { rows } = await adminPool.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [databaseName]
    );

    if (rows.length === 0) {
      console.log(`Creating database: ${databaseName}...`);
      await adminPool.query(`CREATE DATABASE ${databaseName}`);
      console.log(`Database ${databaseName} created successfully!`);
    } else {
      console.log(`Database ${databaseName} already exists.`);
    }
  } catch (error) {
    console.error(`Failed to create database ${databaseName}:`, error);
    throw error;
  } finally {
    await adminPool.end();
  }
}
