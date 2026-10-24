import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { I18nMessageService } from '../i18n/i18n-message.service';

@Injectable()
export class LanguageContextMiddleware implements NestMiddleware {
  constructor(private readonly messages: I18nMessageService) {}

  use(_request: Request, _response: Response, next: NextFunction): void {
    this.messages.runInRequest(() => next());
  }
}
