import { createInitialSeed, type MockDatabase } from './seed';

let currentDb: MockDatabase = createInitialSeed();

export const db: MockDatabase = new Proxy({} as MockDatabase, {
  get(_, prop: string | symbol) {
    return Reflect.get(currentDb, prop);
  },
  set(_, prop: string | symbol, value: unknown) {
    return Reflect.set(currentDb, prop, value);
  },
  ownKeys(_) {
    return Reflect.ownKeys(currentDb);
  },
  getOwnPropertyDescriptor(_, prop: string | symbol) {
    return Reflect.getOwnPropertyDescriptor(currentDb, prop);
  },
});

export function getMockDb(): MockDatabase {
  return db;
}

export function clone<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function sameName(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

export function studentError(status: number, message: string) {
  return { error: { status, message } };
}

export function addAudit(action: string, module: string, details: string, userId = 'user-admin') {
  db.auditLogs.unshift({
    id: uid('aud'),
    userId,
    action,
    module,
    details,
    ipAddress: '103.112.54.18',
    createdAt: nowIso(),
  });
}

export function getDbSnapshot(): MockDatabase {
  return clone(currentDb);
}

export function resetMockDb(): MockDatabase {
  currentDb = createInitialSeed();
  return clone(currentDb);
}
