import { OnApplicationBootstrap, OnModuleDestroy } from '@nestjs/common';
import { Repository } from 'typeorm';
import { LogManager } from '../common/logger/log-manager.service';
import { I18nMessageService } from '../common/i18n/i18n-message.service';
import { MinioService } from '../storage/minio.service';
import { Upload } from '../uploads/entities/upload.entity';
import { RabbitMqService } from './rabbitmq.service';
export declare class UploadWorker implements OnApplicationBootstrap, OnModuleDestroy {
    private readonly uploadsRepository;
    private readonly rabbitMqService;
    private readonly minioService;
    private readonly logger;
    private readonly messages;
    private readonly jobRetryTimers;
    private retryTimer?;
    constructor(uploadsRepository: Repository<Upload>, rabbitMqService: RabbitMqService, minioService: MinioService, logger: LogManager, messages: I18nMessageService);
    onApplicationBootstrap(): Promise<void>;
    onModuleDestroy(): void;
    private startConsumer;
    private process;
    private retry;
    private markAsFailed;
}
