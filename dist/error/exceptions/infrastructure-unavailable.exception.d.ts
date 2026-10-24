import { AppHttpException } from './app-http.exception';
export declare class InfrastructureUnavailableException extends AppHttpException {
    constructor(service: 'MinIO' | 'PostgreSQL' | 'RabbitMQ', code: string, cause: unknown);
}
