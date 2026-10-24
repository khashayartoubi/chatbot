import { ConfigService } from '@nestjs/config';
import type { LogManager } from '../common/logger/log-manager.service';
import { FileTag } from './enums/file-tag.enum';
import { MinioService } from './minio.service';
import { InfrastructureUnavailableException } from '../error/exceptions/infrastructure-unavailable.exception';

describe('MinioService', () => {
  it('uploads and tags a file', async () => {
    const client = {
      bucketExists: jest.fn().mockResolvedValue(true),
      fPutObject: jest.fn().mockResolvedValue(undefined),
      setObjectTagging: jest.fn().mockResolvedValue(undefined),
    };
    const service = new MinioService(new ConfigService({ MINIO_BUCKET: 'files' }), {
      info: jest.fn(),
    } as unknown as LogManager);
    Object.defineProperty(service, 'client', { value: client });

    await service.upload('/tmp/file', 'user/file.pdf', 'application/pdf', 'files', FileTag.USER);

    expect(client.fPutObject).toHaveBeenCalledWith('files', 'user/file.pdf', '/tmp/file', {
      'Content-Type': 'application/pdf',
    });
    expect(client.setObjectTagging).toHaveBeenCalledWith('files', 'user/file.pdf', {
      tag: FileTag.USER,
    });
  });

  it('returns a service unavailable error when MinIO is down', async () => {
    const service = new MinioService(new ConfigService(), {
      info: jest.fn(),
    } as unknown as LogManager);
    Object.defineProperty(service, 'client', {
      value: { bucketExists: jest.fn().mockRejectedValue(new Error('connect ECONNREFUSED')) },
    });

    const promise = service.upload('/tmp/file', 'user/file.pdf', 'application/pdf');
    await expect(promise).rejects.toBeInstanceOf(InfrastructureUnavailableException);
    await expect(promise).rejects.toMatchObject({ status: 503 });
  });
});
