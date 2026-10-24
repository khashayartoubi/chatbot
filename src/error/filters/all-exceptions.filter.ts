import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import type { Request, Response } from 'express';
import { MulterError } from 'multer';
import { QueryFailedError } from 'typeorm';
import type { ErrorBody } from '../../common/interfaces/error-body.interface';
import { LogManager } from '../../common/logger/log-manager.service';

@Catch()
@Injectable()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: LogManager) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const isHttpError = exception instanceof HttpException;
    const status = this.getStatus(exception);
    const exceptionResponse = isHttpError ? exception.getResponse() : undefined;
    const body = this.normalizeBody(exceptionResponse);
    const rawMessage = body.message ?? body.error ?? this.getMessage(exception);
    const message = Array.isArray(rawMessage) ? rawMessage.join(', ') : rawMessage;

    this.log(exception, request, status, message);

    if (response.headersSent) {
      return;
    }

    response.status(status).json({
      success: false,
      status,
      message,
      data: [],
    });
  }

  private getStatus(exception: unknown): number {
    if (exception instanceof HttpException) {
      return exception.getStatus();
    }
    if (exception instanceof QueryFailedError) {
      return HttpStatus.SERVICE_UNAVAILABLE;
    }
    if (exception instanceof MulterError) {
      return exception.code === 'LIMIT_FILE_SIZE' ? HttpStatus.PAYLOAD_TOO_LARGE : HttpStatus.BAD_REQUEST;
    }
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private log(exception: unknown, request: Request, status: number, message: string): void {
    const metadata = {
      method: request.method,
      path: request.url,
      status,
    };

    if (status >= 500) {
      this.logger.failure(AllExceptionsFilter.name, 'HTTP request failed', exception, metadata);
      return;
    }

    this.logger.warning(AllExceptionsFilter.name, 'HTTP request rejected', {
      ...metadata,
      reason: message,
    });
  }

  private normalizeBody(response: string | object | undefined): ErrorBody {
    return typeof response === 'string' ? { message: response } : (response ?? {});
  }

  private getMessage(exception: unknown): string {
    if (exception instanceof Error) {
      return exception.message;
    }
    return String(exception);
  }
}
