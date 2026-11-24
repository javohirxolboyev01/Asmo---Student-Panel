import 'dotenv/config';
import crypto from 'node:crypto';
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

app.use(helmet());
app.use(cors({ origin: config.corsOrigins }));
app.use(compression());
app.use(express.json({ limit: '3mb' }));
morgan.token('rid', (_req, res) => (res as express.Response).locals.requestId);
app.use(
  morgan(
    config.isProduction
      ? ':remote-addr :rid ":method :url" :status :res[content-length] - :response-time ms'
      : 'dev',
  ),
);
app.use('/api', apiRouter);
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));
// Errors thrown before the API router (e.g. malformed JSON) still get a JSON answer.
app.use(errorHandler);

// Open the DB connection up front so the first request doesn't pay for it.
prisma.$connect().catch((error) => logger.error('Database connection failed', { error }));

const server = app.listen(config.port, () =>
  logger.info(`Asmo backend listening on http://localhost:${config.port}`),
);
const stopMaintenance = startMaintenance();

// Graceful shutdown: stop accepting connections, let in-flight requests
// finish (max 10s), then close the DB pool.
let shuttingDown = false;
const shutdown = (signal: string) => {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info(`${signal} received, shutting down`);
  stopMaintenance();
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
