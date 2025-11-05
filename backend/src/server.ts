import app from './app.js';
import { initDb, closeDb } from './infra/database.js';
import { getRedis, closeRedis } from './events/redis.js';

const port = Number(process.env.PORT) || 3000;

async function main() {
  await initDb();
  await getRedis();

  const server = app.listen(port, () => {
    console.log(`API listening on http://localhost:${port}`);
  });

  const shutdown = async () => {
    console.log("Shutting down…");
    server.close(async () => {
      await closeRedis();
      await closeDb();
      process.exit(0);
    });
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error("Fatal boot error:", err);
  process.exit(1);
});
