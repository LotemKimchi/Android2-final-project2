import fs from 'node:fs/promises';
import http from 'node:http';
import { env } from './config/env.js';
import { connectDb } from './config/db.js';
import { createApp } from './app.js';
import { attachSocketServer } from './sockets/index.js';

async function main() {
  await connectDb();
  await fs.mkdir(env.uploadDir, { recursive: true });

  const server = http.createServer(createApp());
  attachSocketServer(server);
  server.listen(env.port, () => console.log(`Circles running at http://localhost:${env.port}`));
}

process.on('unhandledRejection', (reason) => console.error('Unhandled promise rejection:', reason));

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
