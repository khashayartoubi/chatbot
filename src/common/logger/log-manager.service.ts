import { ConsoleLogger, Injectable, LogLevel } from '@nestjs/common';

export type LogMetadata = Record<string, boolean | number | string | null | undefined | object>;
type Environment = 'development' | 'staging' | 'production';
type ManagedLogLevel = 'debug' | 'info' | 'warn' | 'error';

@Injectable()
export class LogManager extends ConsoleLogger {
  private readonly environment = LogManager.environment();
  private readonly centralizedUrl = process.env['CENTRAL_LOG_URL'];

  constructor() {
    super('DanaBackend', {
      logLevels: LogManager.getLogLevels(),
      timestamp: true,
    });
  }

  info(context: string, message: string, metadata?: LogMetadata): void {
    this.log(this.format(message, metadata), context);
  }

  trace(context: string, message: string, metadata?: LogMetadata): void {
    this.debug(this.format(message, metadata), context);
  }

  warning(context: string, message: string, metadata?: LogMetadata): void {
    this.warn(this.format(message, metadata), context);
  }

  failure(context: string, message: string, error?: unknown, metadata?: LogMetadata): void {
    this.error(this.format(message, metadata), error instanceof Error ? error.stack : undefined, context);
  }

  override log(message: unknown, context?: string): void {
    this.write('info', message, context);
  }

  override debug(message: unknown, context?: string): void {
    this.write('debug', message, context);
  }

  override warn(message: unknown, context?: string): void {
    this.write('warn', message, context);
  }

  override error(message: unknown, stack?: string, context?: string): void {
    this.write('error', message, context, stack);
  }

  private static getLogLevels(): LogLevel[] {
    return this.environment() === 'development' ? ['debug', 'log', 'warn', 'error'] : ['log', 'warn', 'error'];
  }

  private static environment(): Environment {
    const value = process.env['NODE_ENV'];
    return value === 'staging' || value === 'production' ? value : 'development';
  }

  private write(level: ManagedLogLevel, message: unknown, context?: string, stack?: string): void {
    if (this.environment !== 'production') {
      this.writeToConsole(level, message, context, stack);
    }

    if (this.environment !== 'development' && this.centralizedUrl) {
      void fetch(this.centralizedUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ level, message: String(message), context, stack, timestamp: new Date().toISOString() }),
      }).catch(() => undefined);
    }
  }

  private writeToConsole(level: ManagedLogLevel, message: unknown, context?: string, stack?: string): void {
    if (level === 'debug') {
      super.debug(message, context);
      return;
    }
    if (level === 'warn') {
      super.warn(message, context);
      return;
    }
    if (level === 'error') {
      super.error(message, stack, context);
      return;
    }
    super.log(message, context);
  }

  private format(message: string, metadata?: LogMetadata): string {
    if (!metadata) {
      return message;
    }

    const values = Object.entries(metadata).filter((entry): entry is [string, boolean | number | string | null] => entry[1] !== undefined);
    return values.length ? `${message} | ${values.map(([key, value]) => `${key}=${String(value)}`).join(' ')}` : message;
  }
}
