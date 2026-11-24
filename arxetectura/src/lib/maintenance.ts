// src/lib/maintenance.ts — periodic housekeeping that keeps tables small.
import { prisma } from './prisma.js';
import { logger } from './logger.js';

const DAY = 86_400_000;

/** Deletes refresh tokens that can never be used again (expired, or revoked over a day ago). */
export async function pruneRefreshTokens() {
  const { count } = await prisma.refreshToken.deleteMany({
    where: {
      OR: [{ expiresAt: { lt: new Date() } }, { revokedAt: { lt: new Date(Date.now() - DAY) } }],
    },
  });
  if (count) logger.info('Pruned refresh tokens', { count });
}

/** Starts the housekeeping loop; returns a stop function. */
export function startMaintenance() {
  const run = () => pruneRefreshTokens().catch((error) => logger.error('Maintenance failed', { error }));
  const first = setTimeout(run, 30_000);
  const timer = setInterval(run, 6 * 60 * 60 * 1000);
  first.unref();
  timer.unref();
  return () => {
    clearTimeout(first);
    clearInterval(timer);
  };
}
