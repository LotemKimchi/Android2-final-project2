import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDb() {
  mongoose.set('strictQuery', true);
  await mongoose.connect(env.mongoUri, { dbName: env.mongoDbName });
  console.log(`MongoDB connected: ${mongoose.connection.name}`);
}
