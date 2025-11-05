import { db } from './database.js';

export interface Migration {
  name: string;
  up: () => Promise<void>;
  down?: () => Promise<void>;
}

const migrations: Migration[] = [
  {
    name: '001_create_customers_table',
    up: async () => {
      await db.query(`
        CREATE TABLE IF NOT EXISTS customers (
          id                  BIGSERIAL PRIMARY KEY,
          name                TEXT NOT NULL,
          email               TEXT NOT NULL,
          document_number     NUMERIC(14,0) NOT NULL,
          created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE UNIQUE INDEX IF NOT EXISTS uniq_customers_email ON customers (LOWER(email));
        CREATE UNIQUE INDEX IF NOT EXISTS uniq_customers_document ON customers (document_number);
      `);
    },
    down: async () => {
      await db.query(`DROP TABLE IF EXISTS customers CASCADE;`);
    },
  },
  {
    name: '002_create_products_table',
    up: async () => {
      await db.query(`
        CREATE TABLE IF NOT EXISTS products (
          id           BIGSERIAL PRIMARY KEY,
          name         TEXT NOT NULL,
          amount       NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
          stock        INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
          created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_products_name ON products (name);
        CREATE UNIQUE INDEX IF NOT EXISTS uniq_products_name ON products (name);
      `);
    },
    down: async () => {
      await db.query(`DROP TABLE IF EXISTS products CASCADE;`);
    },
  },
  {
    name: '003_create_orders_table',
    up: async () => {
      await db.query(`
        CREATE TABLE IF NOT EXISTS orders (
          id           BIGSERIAL PRIMARY KEY,
          customer_id  BIGINT NOT NULL,
          status       TEXT NOT NULL CHECK (status IN ('PENDING_PAYMENT','CONFIRMED', 'CANCELLED','PAYMENT_FAILED')),
          amount       NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (amount >= 0),
          created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

          CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
      `);
    },
    down: async () => {
      await db.query(`DROP TABLE IF EXISTS orders CASCADE;`);
    },
  },
  {
    name: '004_create_order_items_table',
    up: async () => {
      await db.query(`
        CREATE TABLE IF NOT EXISTS order_items (
          id          BIGSERIAL PRIMARY KEY,
          order_id    BIGINT NOT NULL,
          product_id  BIGINT NOT NULL,
          quantity    INTEGER NOT NULL CHECK (quantity > 0),
          amount      NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
          created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

          CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
          CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_order_items_order   ON order_items(order_id);
        CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);
        CREATE UNIQUE INDEX IF NOT EXISTS uniq_order_items_order_product ON order_items(order_id, product_id);
      `);
    },
    down: async () => {
      await db.query(`DROP TABLE IF EXISTS order_items CASCADE;`);
    },
  },
  {
    name: '005_create_outbox_table',
    up: async () => {
      await db.query(`
        CREATE TABLE IF NOT EXISTS outbox (
          id                BIGSERIAL PRIMARY KEY,
          stream            TEXT NOT NULL,
          type              TEXT NOT NULL,
          version           INTEGER NOT NULL DEFAULT 1,
          data              JSONB NOT NULL,
          published         BOOLEAN NOT NULL DEFAULT FALSE,
          published_at      TIMESTAMPTZ,
          created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_outbox_published ON outbox(published, created_at);
        CREATE INDEX IF NOT EXISTS idx_outbox_stream ON outbox(stream);
      `);
    },
    down: async () => {
      await db.query(`DROP TABLE IF EXISTS outbox CASCADE;`);
    },
  },
  {
    name: '006_create_users_table',
    up: async () => {
      await db.query(`
        CREATE TABLE IF NOT EXISTS users (
          id                  BIGSERIAL PRIMARY KEY,
          nickname            TEXT NOT NULL,
          password_hash       TEXT NOT NULL,
          role                TEXT NOT NULL CHECK (role IN ('admin', 'client')) DEFAULT 'client',
          customer_id         BIGINT NOT NULL,
          created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

          CONSTRAINT fk_users_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
        );

        CREATE UNIQUE INDEX IF NOT EXISTS uniq_users_nickname ON users(nickname);
        CREATE INDEX IF NOT EXISTS idx_users_customer ON users(customer_id);
        CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
      `);
    },
    down: async () => {
      await db.query(`DROP TABLE IF EXISTS users CASCADE;`);
    },
  },
];

async function createMigrationsTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id          BIGSERIAL PRIMARY KEY,
      name        TEXT NOT NULL UNIQUE,
      executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

export async function runMigrations() {
  await createMigrationsTable();

  for (const migration of migrations) {
    const { rows } = await db.query(
      'SELECT id FROM migrations WHERE name = $1',
      [migration.name]
    );

    if (rows.length > 0) {
      continue;
    }

    try {
      console.log(`Running migration: ${migration.name}...`);
      await migration.up();
      await db.query('INSERT INTO migrations (name) VALUES ($1)', [migration.name]);
      console.log(`Migration ${migration.name} completed successfully`);
    } catch (error) {
      console.error(`Migration ${migration.name} failed:`, error);
      throw error;
    }
  }

  console.log('All migrations completed!');
}

export async function rollbackMigration(migrationName: string) {
  await createMigrationsTable();

  const { rows } = await db.query(
    'SELECT id FROM migrations WHERE name = $1',
    [migrationName]
  );

  if (rows.length === 0) {
    console.log(`Migration ${migrationName} was not executed, nothing to rollback`);
    return;
  }

  const migration = migrations.find((m) => m.name === migrationName);

  if (!migration) {
    console.log(`Migration ${migrationName} not found in migrations array`);
    return;
  }

  if (!migration.down) {
    console.log(`Migration ${migrationName} has no rollback defined`);
    return;
  }

  try {
    console.log(`Rolling back migration: ${migrationName}...`);
    await migration.down();
    await db.query('DELETE FROM migrations WHERE name = $1', [migrationName]);
    console.log(`Migration ${migrationName} rolled back successfully`);
  } catch (error) {
    console.error(`Migration rollback failed:`, error);
    throw error;
  }
}

export async function rollbackLastMigration() {
  await createMigrationsTable();

  const { rows } = await db.query(
    'SELECT name FROM migrations ORDER BY id DESC LIMIT 1'
  );

  if (rows.length === 0) {
    console.log('No migrations to rollback');
    return;
  }

  const migrationName = rows[0].name;
  await rollbackMigration(migrationName);
}
