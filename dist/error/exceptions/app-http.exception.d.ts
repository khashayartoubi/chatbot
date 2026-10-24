import { HttpException } from '@nestjs/common';
import type { AppHttpExceptionOptions } from '../interfaces/app-http-exception-options.interface';
export type { AppHttpExceptionOptions } from '../interfaces/app-http-exception-options.interface';
export declare class AppHttpException extends HttpException {
    constructor(message: string | string[], status: number, _options?: AppHttpExceptionOptions);
}
