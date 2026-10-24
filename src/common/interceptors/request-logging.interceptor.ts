import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Request, Response } from 'express';
import type { Observable } from 'rxjs';
import { tap } from 'rxjs';
import type { AuthenticatedRequest } from '../../auth/interfaces/authenticated-request.interface';
import { LogManager } from '../logger/log-manager.service';

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: LogManager) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request & Partial<AuthenticatedRequest>>();
    const response = http.getResponse<Response>();
    const requestId = this.getRequestId(request);
    const startedAt = Date.now();

    response.setHeader('x-request-id', requestId);
    this.logger.trace(RequestLoggingInterceptor.name, 'HTTP request started', {
      requestId,
      method: request.method,
      path: request.originalUrl,
      username: request.userName,
      ip: request.ip,
    });

    return next.handle().pipe(
      tap(() => {
        this.logger.info(RequestLoggingInterceptor.name, 'HTTP request completed', {
          requestId,
          method: request.method,
          path: request.originalUrl,
          username: request.userName,
          status: response.statusCode,
          durationMs: Date.now() - startedAt,
        });
      })
    );
  }

  private getRequestId(request: Request): string {
    const header = request.headers['x-request-id'];
    const requestId = Array.isArray(header) ? header[0] : header;
    return requestId?.trim() || randomUUID();
  }
}
