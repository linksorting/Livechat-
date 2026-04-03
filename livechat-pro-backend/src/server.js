import http from "http";
import fs from "fs";
import app from "./app.js";
import env from "./config/env.js";
import { connectDatabase } from "./config/db.js";
import { configureSocket } from "./config/socket.js";
import { seedIfEmpty } from "./services/seed.service.js";

async function bootstrap() {
  fs.mkdirSync(env.fileUploadDir, { recursive: true });
  await connectDatabase();

  if (env.seedOnStart) {
    await seedIfEmpty();
  }

  const server = http.createServer(app);
  const io = configureSocket(server);
  app.locals.io = io;

  server.listen(env.port, () => {
    console.log(`LiveChat Pro backend running on http://localhost:${env.port}`);
  });
}

bootstrap().catch((error) => {
  console.error("Bootstrap failed", error);
  process.exit(1);
});
