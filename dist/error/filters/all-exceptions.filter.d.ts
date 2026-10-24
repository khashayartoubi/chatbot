import { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { LogManager } from '../../common/logger/log-manager.service';
export declare class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger;
    constructor(logger: LogManager);
    catch(exception: unknown, host: ArgumentsHost): void;
    private getStatus;
    private log;
    private normalizeBody;
    private getMessage;
}
