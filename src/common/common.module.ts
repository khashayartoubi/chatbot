import { Global, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { I18nMessageService } from './i18n/i18n-message.service';
import { RequestLoggingInterceptor } from './interceptors/request-logging.interceptor';
import { LogManager } from './logger/log-manager.service';
import { LanguageContextMiddleware } from './middleware/language-context.middleware';

@Global()
@Module({
  providers: [
    LogManager,
    I18nMessageService,
    LanguageContextMiddleware,
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestLoggingInterceptor,
    },
  ],
  exports: [LogManager, I18nMessageService],
})
export class CommonModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(LanguageContextMiddleware).forRoutes('{*path}');
  }
}
