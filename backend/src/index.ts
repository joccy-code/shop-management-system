import "./load-dotenv.js";
import { createApp } from "./app.js";
import { loadEnv } from "./lib/env.js";
import { logger } from "./lib/logger.js";
import { prisma } from "./lib/prisma.js";

async function main() {
  const env = loadEnv();
  const app = createApp();

  const server = app.listen(env.PORT, () => {
    logger.info(
      {
        port: env.PORT,
        appName: env.APP_NAME,
        timezone: env.APP_TIMEZONE,
        currency: env.APP_CURRENCY,
      },
      "Shop Manager API listening",
    );
  });

  const shutdown = async (signal: string) => {
    logger.info({ signal }, "Shutting down API");
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  };

  process.on("SIGINT", () => {
    void shutdown("SIGINT");
  });
  process.on("SIGTERM", () => {
    void shutdown("SIGTERM");
  });
}

main().catch((error: unknown) => {
  logger.error({ err: error }, "Failed to start API");
  process.exit(1);
});
