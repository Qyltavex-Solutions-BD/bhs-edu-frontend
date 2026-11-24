/**
 * Server instrumentation initialization.
 * Automatically invoked by Next.js at server startup.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { logger } = await import('@/src/lib/logger');
    logger.info('Server instrumentation initialized', {
      runtime: process.env.NEXT_RUNTIME,
      nodeEnv: process.env.NODE_ENV,
    });
  }
}
