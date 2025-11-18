import { config } from '../config';

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = config.api.env === 'development';
  }

  private log(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...(context && { context }),
    };

    if (this.isDevelopment) {
      // Pretty print in development
      const levelColors: Record<LogLevel, string> = {
        [LogLevel.DEBUG]: '\x1b[36m', // Cyan
        [LogLevel.INFO]: '\x1b[32m',  // Green
        [LogLevel.WARN]: '\x1b[33m',  // Yellow
        [LogLevel.ERROR]: '\x1b[31m', // Red
      };
      const reset = '\x1b[0m';
      const color = levelColors[level];

      console.log(
        `${color}[${level.toUpperCase()}]${reset} ${timestamp} - ${message}`,
        context ? context : ''
      );
    } else {
      // JSON in production for log aggregation
      console.log(JSON.stringify(logEntry));
    }
  }

  debug(message: string, context?: LogContext) {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: LogContext) {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, error?: Error, context?: LogContext) {
    const errorContext = {
      ...context,
      ...(error && {
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name,
        },
      }),
    };
    this.log(LogLevel.ERROR, message, errorContext);
  }
}

export const logger = new Logger();
