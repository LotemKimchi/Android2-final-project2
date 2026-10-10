import dns from 'node:dns';
import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDb() {
  // Node's resolver can pick up a dead DNS server (e.g. 127.0.0.1) on Windows,
  // which breaks the SRV lookup for mongodb+srv:// URIs. Use public DNS instead.
  dns.setServers(['8.8.8.8', '1.1.1.1']);
  mongoose.set('strictQuery', true);
  await mongoose.connect(env.mongoUri, { dbName: env.mongoDbName });
  console.log(`MongoDB connected: ${mongoose.connection.name}`);
}
