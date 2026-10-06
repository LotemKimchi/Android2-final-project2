import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import morgan from 'morgan';
import { env, isProduction } from './config/env.js';
import { PUBLIC_DIR, VIEWS_DIR } from './config/paths.js';
import apiRouter from './routes/api/index.js';
import pageRouter from './routes/pages.js';
import { authenticate } from './middleware/auth.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const CDN_SCRIPT_SOURCES = ['https://code.jquery.com', 'https://cdn.jsdelivr.net'];

export function createApp() {
  const app = express();

  app.set('view engine', 'ejs');
  app.set('views', VIEWS_DIR);

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          'script-src': ["'self'", ...CDN_SCRIPT_SOURCES],
          'img-src': ["'self'", 'data:', 'blob:'],
          'media-src': ["'self'", 'blob:'],
          // Safari upgrades http://localhost subresources to https, which breaks local runs.
          'upgrade-insecure-requests': null,
        },
      },
    }),
  );
  app.use(morgan(isProduction ? 'combined' : 'dev'));
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: false, limit: '100kb' }));
  app.use(cookieParser());
  app.use(express.static(PUBLIC_DIR));
  app.use('/uploads', express.static(env.uploadDir));

  app.use(authenticate);

  app.use('/api', apiRouter);
  app.use('/', pageRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
