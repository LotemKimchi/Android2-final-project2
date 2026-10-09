import 'dotenv/config';
import path from 'node:path';
import { ROOT_DIR } from './paths.js';

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function jwtSecret() {
  const secret = required('JWT_SECRET');
  if (secret.length < 32) throw new Error('JWT_SECRET must be at least 32 characters long');
  return secret;
}

/** MONGO_URI as copied from Atlas, with its <db_username>/<db_password> placeholders filled in. */
function mongoUri() {
  let uri = required('MONGO_URI');
  if (uri.includes('<db_username>')) {
    uri = uri.replace('<db_username>', encodeURIComponent(required('MONGO_USERNAME')));
  }
  if (uri.includes('<db_password>')) {
    uri = uri.replace('<db_password>', encodeURIComponent(required('MONGO_PASSWORD')));
  }
  return uri;
}

export const env = Object.freeze({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3000),
  mongoUri: mongoUri(),
  mongoDbName: process.env.MONGO_DB_NAME ?? 'circles',
  jwtSecret: jwtSecret(),
  uploadDir: path.resolve(ROOT_DIR, process.env.UPLOAD_DIR ?? 'uploads'),
});

export const isProduction = env.nodeEnv === 'production';
