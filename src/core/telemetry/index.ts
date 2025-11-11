export type TelemetryEvent = {
  readonly timestamp: number;
  readonly name: string;
  readonly properties?: Record<string, unknown>;
};

export interface TelemetryClient {
  capture(event: TelemetryEvent): Promise<void>;
  flush(): Promise<void>;
}

export interface Logger {
  debug(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
  child(context: Record<string, unknown>): Logger;
}

export { WinstonLogger } from './logger';
