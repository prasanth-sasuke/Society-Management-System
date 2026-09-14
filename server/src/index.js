import { config } from "./config.js";
import { prisma } from "./prisma.js";
import { createApp } from "./app.js";

const app = createApp();

const server = app.listen(config.port, config.listenHost, () => {
  console.log(`API listening on http://${config.listenHost}:${config.port}`);
});

async function shutdown() {
  server.close();
  await prisma.$disconnect();
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
