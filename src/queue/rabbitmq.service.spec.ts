import { ConfigService } from '@nestjs/config';
import type { ConfirmChannel } from 'amqplib';
import type { LogManager } from '../common/logger/log-manager.service';
import { RabbitMqService } from './rabbitmq.service';
import { InfrastructureUnavailableException } from '../error/exceptions/infrastructure-unavailable.exception';

describe('RabbitMqService', () => {
  it('publishes a persistent upload job', async () => {
    const sendToQueue = jest.fn();
    const waitForConfirms = jest.fn().mockResolvedValue(undefined);
    const channel = {
      sendToQueue,
      waitForConfirms,
    } as unknown as ConfirmChannel;
    const service = new RabbitMqService(new ConfigService(), {
      trace: jest.fn(),
      failure: jest.fn(),
    } as unknown as LogManager);
    jest.spyOn(service, 'getChannel').mockResolvedValue(channel);

    await service.publish({ uploadId: 'upload-id' });

    expect(sendToQueue).toHaveBeenCalledWith('file.uploads', expect.any(Buffer), {
      persistent: true,
    });
    expect(waitForConfirms).toHaveBeenCalled();
  });

  it('returns a service unavailable error when RabbitMQ is down', async () => {
    const service = new RabbitMqService(new ConfigService(), {
      failure: jest.fn(),
    } as unknown as LogManager);
    jest.spyOn(service, 'getChannel').mockRejectedValue(new Error('connect ECONNREFUSED'));

    const promise = service.publish({ uploadId: 'upload-id' });
    await expect(promise).rejects.toBeInstanceOf(InfrastructureUnavailableException);
    await expect(promise).rejects.toMatchObject({ status: 503 });
  });
});
