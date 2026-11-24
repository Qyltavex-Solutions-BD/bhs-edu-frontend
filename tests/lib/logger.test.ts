import assert from 'node:assert/strict';
import test from 'node:test';
import { createLogger, Logger } from '@/src/lib/logger';

test('Structured logger instrumentation', async (t) => {
  await t.test('creates logger instance with module namespace', () => {
    const logger = createLogger('TestModule');
    assert.ok(logger instanceof Logger);
  });

  await t.test('safely handles logging with error and metadata without throwing', () => {
    const logger = createLogger('ErrorAudit');
    assert.doesNotThrow(() => {
      logger.info('User initiated action', { userId: 'usr-123', action: 'EXPORT' });
      logger.warn('Rate limit approaching', { current: 95, limit: 100 });
      logger.error('Failed to dispatch notification', new Error('Network timeout'), { retryCount: 3 });
    });
  });
});
