import { ConsoleLogger } from '@nestjs/common';
export type LogMetadata = Record<string, boolean | number | string | null | undefined | object>;
export declare class LogManager extends ConsoleLogger {
    private readonly environment;
    private readonly centralizedUrl;
    constructor();
    info(context: string, message: string, metadata?: LogMetadata): void;
    trace(context: string, message: string, metadata?: LogMetadata): void;
    warning(context: string, message: string, metadata?: LogMetadata): void;
    failure(context: string, message: string, error?: unknown, metadata?: LogMetadata): void;
    log(message: unknown, context?: string): void;
    debug(message: unknown, context?: string): void;
    warn(message: unknown, context?: string): void;
    error(message: unknown, stack?: string, context?: string): void;
    private static getLogLevels;
    private static environment;
    private write;
    private writeToConsole;
    private format;
}
