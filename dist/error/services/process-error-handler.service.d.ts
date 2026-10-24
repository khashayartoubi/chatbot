import { OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import { LogManager } from '../../common/logger/log-manager.service';
export declare class ProcessErrorHandler implements OnApplicationBootstrap, OnApplicationShutdown {
    private readonly logger;
    constructor(logger: LogManager);
    onApplicationBootstrap(): void;
    onApplicationShutdown(): void;
    private readonly handleUnhandledRejection;
    private readonly handleUncaughtException;
}
