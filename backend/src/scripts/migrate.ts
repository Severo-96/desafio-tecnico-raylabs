import dotenv from 'dotenv';
import { runMigrations, rollbackLastMigration, rollbackMigration } from '../infra/migrations.js';
import { db } from '../infra/database.js';

dotenv.config();

async function main() {
  const command = process.argv[2];
  const migrationName = process.argv[3];

  try {
    if (command === 'up') {
      await runMigrations();
    } else if (command === 'down') {
      if (migrationName) {
        await rollbackMigration(migrationName);
      } else {
        await rollbackLastMigration();
      }
    }
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  } finally {
    await db.end();
  }
}

main();
