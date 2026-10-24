import { OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConfirmChannel } from 'amqplib';
import { LogManager } from '../common/logger/log-manager.service';
export declare class RabbitMqService implements OnModuleDestroy {
    private readonly configService;
    private readonly logger;
    readonly queueName = "file.uploads";
    private connection?;
    private channel?;
    private connecting?;
    constructor(configService: ConfigService, logger: LogManager);
    getChannel(): Promise<ConfirmChannel>;
    publish(message: object): Promise<void>;
    onModuleDestroy(): Promise<void>;
    private connect;
}
