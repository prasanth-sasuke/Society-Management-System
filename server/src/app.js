import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";
import { config } from "./config.js";
import { errorHandler, notFound } from "./http.js";
import { api } from "./routes.js";

const webDist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../web/dist");

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  if (config.nodeEnv === "production") {
    app.set("trust proxy", 1);
  }
  app.use(cors({ origin: config.corsOrigins }));
  app.use(express.json({ limit: "100kb" }));
  app.use("/api", api);

  if (config.nodeEnv === "production" && existsSync(path.join(webDist, "index.html"))) {
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
