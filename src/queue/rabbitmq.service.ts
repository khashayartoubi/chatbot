import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import amqp, { ChannelModel, ConfirmChannel } from 'amqplib';
import { LogManager } from '../common/logger/log-manager.service';
import { InfrastructureUnavailableException } from '../error/exceptions/infrastructure-unavailable.exception';

@Injectable()
export class RabbitMqService implements OnModuleDestroy {
  readonly queueName = 'file.uploads';

  private connection?: ChannelModel;
  private channel?: ConfirmChannel;
  private connecting?: Promise<ConfirmChannel>;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LogManager
  ) {}

  async getChannel(): Promise<ConfirmChannel> {
    if (this.channel) {
      return this.channel;
    }

    this.connecting ??= this.connect().catch((error: unknown) => {
      this.connecting = undefined;
      throw new InfrastructureUnavailableException('RabbitMQ', 'RABBITMQ_UNAVAILABLE', error);
    });
    return this.connecting;
  }

  async publish(message: object): Promise<void> {
    try {
      const channel = await this.getChannel();
      channel.sendToQueue(this.queueName, Buffer.from(JSON.stringify(message)), { persistent: true });
      await channel.waitForConfirms();
      this.logger.trace(RabbitMqService.name, 'Upload job published', {
        queue: this.queueName,
      });
    } catch (error) {
      this.channel = undefined;
      this.connecting = undefined;
      this.logger.failure(RabbitMqService.name, 'Could not publish upload job', error, {
        queue: this.queueName,
      });
      if (error instanceof InfrastructureUnavailableException) {
        throw error;
      }
      throw new InfrastructureUnavailableException('RabbitMQ', 'RABBITMQ_UNAVAILABLE', error);
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.channel?.close();
    await this.connection?.close();
  }

  private async connect(): Promise<ConfirmChannel> {
    const url = this.configService.get<string>('RABBITMQ_URL', 'amqp://guest:guest@localhost:5672');
    this.logger.info(RabbitMqService.name, 'Connecting to RabbitMQ', {
      queue: this.queueName,
    });
    this.connection = await amqp.connect(url);
    this.connection.on('close', () => {
      this.logger.warning(RabbitMqService.name, 'RabbitMQ connection closed', {
        queue: this.queueName,
      });
      this.connection = undefined;
      this.channel = undefined;
      this.connecting = undefined;
    });
    this.channel = await this.connection.createConfirmChannel();
    await this.channel.assertQueue(this.queueName, { durable: true });
    this.logger.info(RabbitMqService.name, 'RabbitMQ connection ready', {
      queue: this.queueName,
    });
    return this.channel;
  }
}
