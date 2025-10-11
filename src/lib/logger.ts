// src/lib/logger.ts
type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogMessage {
  level: LogLevel;
  message: string;
  data?: Record<string, unknown>;
  timestamp: string;
}

export const logger = {
  info: (message: string, data?: Record<string, unknown>) => {
    const log: LogMessage = {
      level: 'info',
      message,
      data,
      timestamp: new Date().toISOString()
    };
    console.log(JSON.stringify(log));
  },

  warn: (message: string, data?: Record<string, unknown>) => {
    const log: LogMessage = {
      level: 'warn',
      message,
      data,
      timestamp: new Date().toISOString()
    };
    console.warn(JSON.stringify(log));
  },

  error: (message: string, data?: Record<string, unknown>) => {
    const log: LogMessage = {
      level: 'error',
      message,
      data,
      timestamp: new Date().toISOString()
    };
    console.error(JSON.stringify(log));
  },

  debug: (message: string, data?: Record<string, unknown>) => {
    if (process.env.NODE_ENV === 'development') {
      const log: LogMessage = {
        level: 'debug',
        message,
        data,
        timestamp: new Date().toISOString()
      };
      console.debug(JSON.stringify(log));
    }
  }
};
