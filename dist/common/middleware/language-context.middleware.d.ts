import { NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { I18nMessageService } from '../i18n/i18n-message.service';
export declare class LanguageContextMiddleware implements NestMiddleware {
    private readonly messages;
    constructor(messages: I18nMessageService);
    use(_request: Request, _response: Response, next: NextFunction): void;
}
