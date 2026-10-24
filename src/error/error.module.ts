import { Global, Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';
import { ProcessErrorHandler } from './services/process-error-handler.service';

@Global()
@Module({
  providers: [
    ProcessErrorHandler,
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class ErrorModule {}
