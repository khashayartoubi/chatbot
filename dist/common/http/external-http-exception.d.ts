import { HttpException } from '@nestjs/common';
export declare function externalHttpException(error: unknown): Promise<HttpException | undefined>;
export declare function aiHttpException(error: unknown): Promise<HttpException | undefined>;
export declare function httpExceptionMessage(error: unknown): string | undefined;
export declare function isServiceUnavailableError(error: unknown): boolean;
