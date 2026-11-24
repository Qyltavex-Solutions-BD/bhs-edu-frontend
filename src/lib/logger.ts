/**
 * Structured Logging and Diagnostics Utility for BHS Frontend
 *
 * Provides safe, structured logging with log level filtering, metadata attachment,
 * and production-safe formatting across both Server and Client Components.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  module: string;
  message: string;
  timestamp: string;
  data?: unknown;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentMinLevel: LogLevel =
  process.env.NODE_ENV === 'production' ? 'info' : 'debug';

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[currentMinLevel];
}

function formatLogEntry(entry: LogEntry): string {
  if (process.env.NODE_ENV === 'production') {
    return JSON.stringify(entry);
  }
  return `[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.module}] ${entry.message}`;
}

export class Logger {
  private module: string;

  constructor(module: string) {
    this.module = module;
  }

  private createEntry(level: LogLevel, message: string, data?: unknown, err?: unknown): LogEntry {
    const entry: LogEntry = {
      level,
      module: this.module,
      message,
      timestamp: new Date().toISOString(),
    };

    if (data !== undefined) {
      entry.data = data;
    }

    if (err instanceof Error) {
      entry.error = {
        name: err.name,
        message: err.message,
        stack: err.stack,
      };
    } else if (err) {
      entry.error = {
        name: 'UnknownError',
        message: String(err),
      };
    }

    return entry;
  }

  debug(message: string, data?: unknown) {
    if (!shouldLog('debug')) return;
    const entry = this.createEntry('debug', message, data);
    console.debug(formatLogEntry(entry), data ?? '');
  }

  info(message: string, data?: unknown) {
    if (!shouldLog('info')) return;
    const entry = this.createEntry('info', message, data);
    console.info(formatLogEntry(entry), data ?? '');
  }

  warn(message: string, data?: unknown) {
    if (!shouldLog('warn')) return;
    const entry = this.createEntry('warn', message, data);
    console.warn(formatLogEntry(entry), data ?? '');
  }

  error(message: string, err?: unknown, data?: unknown) {
    if (!shouldLog('error')) return;
    const entry = this.createEntry('error', message, data, err);
    console.error(formatLogEntry(entry), err ?? '', data ?? '');
  }
}

export function createLogger(module: string): Logger {
  return new Logger(module);
}

export const appLogger = createLogger('App');
export const logger = appLogger;

