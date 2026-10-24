import { HttpStatus } from '@nestjs/common';
import { AppHttpException } from './app-http.exception';

export class InfrastructureUnavailableException extends AppHttpException {
  constructor(service: 'MinIO' | 'PostgreSQL' | 'RabbitMQ', code: string, cause: unknown) {
    const causeMessage = cause instanceof Error ? cause.message : String(cause);
    super(`${service} service is unavailable: ${causeMessage}`, HttpStatus.SERVICE_UNAVAILABLE, {
      code,
    });
  }
}
