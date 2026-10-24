import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import type { Observable } from 'rxjs';
import { LogManager } from '../logger/log-manager.service';
export declare class RequestLoggingInterceptor implements NestInterceptor {
    private readonly logger;
    constructor(logger: LogManager);
    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown>;
    private getRequestId;
}
