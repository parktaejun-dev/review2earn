// 📂 src/lib/logger.ts
// Review2Earn v6.0 - Production Logger

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogMetadata {
  [key: string]: any;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private formatMessage(level: LogLevel, message: string, metadata?: LogMetadata): string {
    const timestamp = new Date().toISOString();
    
    if (this.isDevelopment) {
      const emoji = { debug: '🔍', info: 'ℹ️', warn: '⚠️', error: '❌' }[level];
      return `${emoji} [${level.toUpperCase()}] ${message}`;
    }
    
    return JSON.stringify({ timestamp, level, message, ...metadata });
  }

  debug(message: string, metadata?: LogMetadata) {
    if (this.isDevelopment) {
      console.log(this.formatMessage('debug', message, metadata));
    }
  }

  info(message: string, metadata?: LogMetadata) {
    console.log(this.formatMessage('info', message, metadata));
  }

  warn(message: string, metadata?: LogMetadata) {
    console.warn(this.formatMessage('warn', message, metadata));
  }

  error(message: string, error?: Error | unknown, metadata?: LogMetadata) {
    const errorMeta = error instanceof Error ? {
      error: error.message,
      stack: error.stack,
      ...metadata,
    } : metadata;
    
    console.error(this.formatMessage('error', message, errorMeta));
  }

  api(method: string, url: string, status: number, duration?: number) {
    const message = `${method} ${url} - ${status}`;
    const metadata = { method, url, status, duration };
    
    if (status >= 400) {
      this.error(message, undefined, metadata);
    } else {
      this.info(message, metadata);
    }
  }
}

export const logger = new Logger();
