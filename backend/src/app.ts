import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import { loadEnv } from "./lib/env.js";
import { logger } from "./lib/logger.js";
import { csrfProtection } from "./middleware/csrf.js";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";
import { apiV1Router } from "./routes/index.js";

export function createApp() {
  const env = loadEnv();
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use(helmet());
  app.use(
    pinoHttp({
      logger,
      autoLogging: env.NODE_ENV !== "test",
    }),
  );

  if (env.CORS_ORIGIN) {
    app.use(
      cors({
        origin: env.CORS_ORIGIN,
        credentials: true,
      }),
    );
  }

  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.use("/api/v1", csrfProtection);

  app.get("/", (_req, res) => {
    res.json({
      success: true,
      data: {
        name: env.APP_NAME,
        api: "/api/v1",
      },
    });
  });

  app.use("/api/v1", apiV1Router);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
