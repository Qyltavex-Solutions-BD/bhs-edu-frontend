import assert from 'node:assert/strict';
import test from 'node:test';
import { parseEnv } from '@/src/lib/env';

test('Application environment schema and fallback validation', async (t) => {
  await t.test('uses safe defaults when no environment variables are set', () => {
    const parsed = parseEnv({});
    assert.equal(parsed.NODE_ENV, 'development');
    assert.equal(parsed.NEXT_PUBLIC_API_URL, 'http://localhost:4000/api/v1');
    assert.equal(parsed.NEXT_PUBLIC_USE_MOCK_API, true);
    assert.equal(parsed.NEXT_PUBLIC_ENABLE_STUDENT_PORTAL, false);
    assert.equal(parsed.NEXT_PUBLIC_ENABLE_FUTURE_MODULES, false);
    assert.equal(parsed.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY, '');
  });

  await t.test('correctly parses explicit production environment overrides', () => {
    const parsed = parseEnv({
      NODE_ENV: 'production',
      NEXT_PUBLIC_API_URL: 'https://api.bhs.edu.bd/api/v1',
      NEXT_PUBLIC_USE_MOCK_API: 'false',
      NEXT_PUBLIC_ENABLE_STUDENT_PORTAL: 'true',
      NEXT_PUBLIC_ENABLE_FUTURE_MODULES: 'true',
      NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: 'AIzaSyDemoKey123',
    });
    assert.equal(parsed.NODE_ENV, 'production');
    assert.equal(parsed.NEXT_PUBLIC_API_URL, 'https://api.bhs.edu.bd/api/v1');
    assert.equal(parsed.NEXT_PUBLIC_USE_MOCK_API, false);
    assert.equal(parsed.NEXT_PUBLIC_ENABLE_STUDENT_PORTAL, true);
    assert.equal(parsed.NEXT_PUBLIC_ENABLE_FUTURE_MODULES, true);
    assert.equal(parsed.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY, 'AIzaSyDemoKey123');
  });
});
