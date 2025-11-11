import winston from 'winston';
import { existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import type { Logger, TelemetryConfig } from '../index';

export class WinstonLogger implements Logger {
  private logger: winston.Logger;

  constructor(config: TelemetryConfig, context?: Record<string, unknown>) {
    // Ensure log directory exists
    if (config.logDir) {
      const logDir = config.logDir;
      if (!existsSync(logDir)) {
        mkdirSync(logDir, { recursive: true });
      }
    }

    const transports: winston.transport[] = [
      // Console output
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        ),
      }),
    ];

    // File outputs
    if (config.logDir) {
      transports.push(
        new winston.transports.File({
          filename: `${config.logDir}/error.log`,
          level: 'error',
          format: winston.format.json(),
        }),
        new winston.transports.File({
          filename: `${config.logDir}/combined.log`,
          format: winston.format.json(),
        })
      );
    }

    this.logger = winston.createLogger({
      level: config.logLevel || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: context || {},
      transports,
    });
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    this.logger.debug(message, meta);
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.logger.info(message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.logger.warn(message, meta);
  }

  error(message: string, meta?: Record<string, unknown>): void {
    this.logger.error(message, meta);
  }

  child(context: Record<string, unknown>): Logger {
    const childLogger = this.logger.child(context);
    return new WinstonLoggerWrapper(childLogger);
  }
}

class WinstonLoggerWrapper implements Logger {
  constructor(private logger: winston.Logger) {}

  debug(message: string, meta?: Record<string, unknown>): void {
    this.logger.debug(message, meta);
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.logger.info(message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.logger.warn(message, meta);
  }

  error(message: string, meta?: Record<string, unknown>): void {
    this.logger.error(message, meta);
  }

  child(context: Record<string, unknown>): Logger {
    return new WinstonLoggerWrapper(this.logger.child(context));
  }
}

