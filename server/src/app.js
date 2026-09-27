import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";
import { config } from "./config.js";
import { errorHandler, notFound, requestLogger, securityHeaders } from "./http.js";
import { api } from "./routes.js";

const webDist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../web/dist");

export function createApp() {
  const app = express();
  const production = config.nodeEnv === "production";
  app.disable("x-powered-by");
  if (production) {
    app.set("trust proxy", 1);
  }
  app.use(securityHeaders(production));
  if (production || process.env.LOG_REQUESTS === "1") app.use(requestLogger);
  app.use(cors({ origin: config.corsOrigins }));
  app.use(express.json({ limit: "100kb" }));
  app.use("/api", api);

  if (config.nodeEnv === "production" && existsSync(path.join(webDist, "index.html"))) {
    // Vite puts a content hash in every /assets filename, so those can be cached for good.
    app.use("/assets", express.static(path.join(webDist, "assets"), { maxAge: "365d", immutable: true }));
    app.use(express.static(webDist, { index: false, maxAge: "1h" }));
    app.use((req, res, next) => {
      if (req.path.startsWith("/api")) return next();
      if (req.method !== "GET" && req.method !== "HEAD") return next();
      res.sendFile(path.join(webDist, "index.html"), (err) => {
        if (err) next(err);
      });
    });
  }

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
