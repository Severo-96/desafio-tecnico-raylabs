import dotenv from 'dotenv';
import { runMigrations } from '../infra/migrations.js';
import { seed } from '../infra/seed.js';
import { db, createDatabaseIfNotExists } from '../infra/database.js';

dotenv.config();

async function main() {
  console.log('Starting database setup...');
  console.log('');

  try {
    console.log('Checking test database...');
    await createDatabaseIfNotExists('ecommerce_test');
    console.log('');

    // Run migration and seed on the development database
    console.log('Running migrations and seeding...');
    await runMigrations();
    await seed();
    console.log('Setup completed successfully!');
  } catch (error) {
    console.error('Setup failed:', error);
    process.exit(1);
  } finally {
    await db.end();
  }
}

main();
