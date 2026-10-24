import { HttpException } from '@nestjs/common';
import type { AppHttpExceptionOptions } from '../interfaces/app-http-exception-options.interface';

export type { AppHttpExceptionOptions } from '../interfaces/app-http-exception-options.interface';

export class AppHttpException extends HttpException {
  constructor(message: string | string[], status: number, _options?: AppHttpExceptionOptions) {
    void _options;
    super(
      {
        success: false,
        status,
        message: Array.isArray(message) ? message.join(', ') : message,
        data: [],
      },
      status
    );
  }
}
