import dotenv from 'dotenv';
import { seed, clearSeed } from '../infra/seed.js';
import { db } from '../infra/database.js';

dotenv.config();

async function main() {
  const command = process.argv[2];

  try {
    if (command === 'run') {
      await seed();
    } else if (command === 'clear') {
      await clearSeed();
    }
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  } finally {
    await db.end();
  }
}

main();
