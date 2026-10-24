import { Injectable, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import { LogManager } from '../../common/logger/log-manager.service';

@Injectable()
export class ProcessErrorHandler implements OnApplicationBootstrap, OnApplicationShutdown {
  constructor(private readonly logger: LogManager) {}

  onApplicationBootstrap(): void {
    process.on('unhandledRejection', this.handleUnhandledRejection);
    process.on('uncaughtException', this.handleUncaughtException);
  }

  onApplicationShutdown(): void {
    process.off('unhandledRejection', this.handleUnhandledRejection);
    process.off('uncaughtException', this.handleUncaughtException);
  }

  private readonly handleUnhandledRejection = (reason: unknown): void => {
    this.logger.failure(ProcessErrorHandler.name, 'Unhandled promise rejection', reason);
  };

  private readonly handleUncaughtException = (error: Error): void => {
    this.logger.failure(ProcessErrorHandler.name, 'Uncaught application exception', error);
  };
}
