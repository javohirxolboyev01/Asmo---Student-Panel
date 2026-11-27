import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import apiRouter from './apiRouter.js';
import { config } from './config.js';
import { prisma } from './lib/prisma.js';
import { logger } from './lib/logger.js';
import { errorHandler } from './middleware/index.js';
import { startMaintenance } from './lib/maintenance.js';
import { startTelegramBot } from './modules/telegram/telegram.bot.js';
import { startPaymentWatcher } from './modules/payments/payments.tracking.js';
import { startHomeworkReminderWatcher } from './modules/homework/homework.reminders.js';
import { startChatArchiver } from './modules/chat/chat.archive.js';
import { startLessonReminderWatcher } from './modules/lessons/lesson.reminders.js';

const app = express();
app.set('trust proxy', config.trustProxy);
app.disable('x-powered-by');

// Every request gets an id (or keeps the proxy's), echoed back and used in error logs.
app.use((req, res, next) => {
  const incoming = req.get('x-request-id');
  const id = incoming && /^[\w-]{8,64}$/.test(incoming) ? incoming : crypto.randomUUID();
  res.locals.requestId = id;
  res.setHeader('X-Request-Id', id);
  next();
});

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        // Avatars and product images may be external URLs or data: URLs.
        'img-src': ["'self'", 'data:', 'blob:', 'https:'],
        // Chat voice messages / videos are fetched with the staff token and
        // played from blob: URLs (also read back to draw the voice waveform).
        'media-src': ["'self'", 'blob:'],
        'connect-src': ["'self'", 'blob:'],
        // Telegram Mini App SDK.
        'script-src': ["'self'", 'https://telegram.org'],
        // Telegram Web shows Mini Apps in an iframe.
        'frame-ancestors': ["'self'", 'https://web.telegram.org', 'https://*.telegram.org'],
      },
    },
    // frame-ancestors above replaces X-Frame-Options (which would block Telegram Web).
    frameguard: false,
  }),
);
app.use(cors({ origin: config.corsOrigins, exposedHeaders: ['X-Total-Count', 'X-Request-Id'] }));
app.use(compression());
app.use(express.json({ limit: '3mb' }));
morgan.token('rid', (_req, res) => (res as express.Response).locals.requestId);
// Background polls (chat badge / open thread / notifications) hit the server
// every few seconds per open tab: log them only when they fail.
const POLL_PATHS = /^\/api\/(teacher\/chats\/unread|teacher\/chats\/[^/]+\?after=|notifications(\?|$))/;
app.use(
  morgan(
    config.isProduction
      ? ':remote-addr :rid ":method :url" :status :res[content-length] - :response-time ms'
      : 'dev',
    {
      skip: (req, res) => req.method === 'GET' && res.statusCode < 400 && POLL_PATHS.test(req.originalUrl),
    },
  ),
);
app.use('/api', apiRouter);
app.use('/api', (_req, res) => res.status(404).json({ error: 'Route not found' }));

// Single-service deploy: the built frontend (repo-root dist/, or FRONTEND_DIR)
// is served by this same server, so one Railway service hosts both.
const frontendDir =
  process.env.FRONTEND_DIR ??
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../dist');
if (fs.existsSync(path.join(frontendDir, 'index.html'))) {
  app.use(
    express.static(frontendDir, {
      index: false,
      setHeaders: (res, filePath) => {
        // Hashed build assets never change; everything else must revalidate
        // so a new deploy (index.html, service worker) is picked up at once.
        res.setHeader(
          'Cache-Control',
          filePath.includes(`${path.sep}assets${path.sep}`)
            ? 'public, max-age=31536000, immutable'
            : 'public, max-age=0, must-revalidate',
        );
      },
    }),
  );
  // SPA fallback: any other GET that wants HTML gets the app shell.
  app.get(/.*/, (req, res, next) => {
    if (!req.accepts('html')) return next();
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    res.sendFile(path.join(frontendDir, 'index.html'));
  });
  logger.info('Serving frontend', { dir: frontendDir });
}
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));
// Errors thrown before the API router (e.g. malformed JSON) still get a JSON answer.
app.use(errorHandler);

// Open the DB connection up front so the first request doesn't pay for it.
prisma.$connect().catch((error) => logger.error('Database connection failed', { error }));

const server = app.listen(config.port, () =>
  logger.info(`Asmo backend listening on http://localhost:${config.port}`),
);
const stopMaintenance = startMaintenance();
const stopTelegramBot = startTelegramBot();
const stopPaymentWatcher = startPaymentWatcher();
const stopHomeworkReminderWatcher = startHomeworkReminderWatcher();
const stopChatArchiver = startChatArchiver();
const stopLessonReminderWatcher = startLessonReminderWatcher();

// Graceful shutdown: stop accepting connections, let in-flight requests
// finish (max 10s), then close the DB pool.
let shuttingDown = false;
const shutdown = (signal: string) => {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info(`${signal} received, shutting down`);
  stopMaintenance();
  stopTelegramBot();
  stopPaymentWatcher();
  stopHomeworkReminderWatcher();
  stopChatArchiver();
  stopLessonReminderWatcher();
  const force = setTimeout(() => process.exit(1), 10_000);
  force.unref();
  server.close(async () => {
    await prisma.$disconnect().catch(() => undefined);
    process.exit(0);
  });
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (reason) => logger.error('Unhandled promise rejection', { error: reason }));
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { error });
  shutdown('uncaughtException');
});
