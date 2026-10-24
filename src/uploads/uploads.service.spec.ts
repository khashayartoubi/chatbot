import type { Repository } from 'typeorm';
import { Readable } from 'node:stream';
import { ConfigService } from '@nestjs/config';
import type { LogManager } from '../common/logger/log-manager.service';
import type { I18nMessageService } from '../common/i18n/i18n-message.service';
import type { Project } from '../projects/entities/project.entity';
import { Upload } from './entities/upload.entity';
import { FileState } from './enums/file-state.enum';
import { FileTag } from '../storage/enums/file-tag.enum';
import { UploadStatus } from './enums/upload-status.enum';
import type { RabbitMqService } from '../queue/rabbitmq.service';
import type { MinioService } from '../storage/minio.service';
import { UploadsService } from './uploads.service';

describe('UploadsService', () => {
  it('returns an owned completed attachment for download', async () => {
    const upload = Object.assign(new Upload(), {
      fileId: 'file-id',
      username: 'khashayar',
      filename: 'report.pdf',
      state: FileState.DONE,
      objectName: 'khashayar/upload/report.pdf',
      bucket: 'dana-client',
    });
    const stream = Readable.from(Buffer.from('file'));
    const service = new UploadsService(
      { findOneBy: jest.fn().mockResolvedValue(upload) } as unknown as Repository<Upload>,
      {} as Repository<Project>,
      {} as RabbitMqService,
      { preview: jest.fn().mockResolvedValue({ stream, size: 4 }) } as unknown as MinioService,
      {} as LogManager,
      { translate: (key: string) => key } as I18nMessageService,
      new ConfigService({ MINIO_BUCKET: 'dana-client' })
    );

    await expect(service.download('file-id', 'khashayar')).resolves.toEqual({ upload, stream, size: 4 });
  });

  it('downloads an attachment directly from the user MinIO folder when its database record is missing', async () => {
    const stream = Readable.from(Buffer.from('file'));
    const minio = {
      findUserObject: jest.fn().mockResolvedValue({
        bucket: 'dana-client',
        objectName: 'khashayar/34612505051630/report.pdf',
        size: 4,
        mimeType: 'application/pdf',
      }),
      getFullPath: jest.fn().mockReturnValue('minio://dana-client/khashayar/34612505051630/report.pdf'),
      preview: jest.fn().mockResolvedValue({ stream, size: 4 }),
    };
    const service = new UploadsService(
      { findOneBy: jest.fn().mockResolvedValue(null) } as unknown as Repository<Upload>,
      {} as Repository<Project>,
      {} as RabbitMqService,
      minio as unknown as MinioService,
      {} as LogManager,
      { translate: (key: string) => key } as I18nMessageService,
      new ConfigService({ MINIO_BUCKET: 'dana-client' })
    );

    const result = await service.download('34612505051630', 'khashayar');

    expect(minio.findUserObject).toHaveBeenCalledWith('34612505051630', 'khashayar');
    expect(result.upload).toMatchObject({
      filename: 'report.pdf',
      objectName: 'khashayar/34612505051630/report.pdf',
      bucket: 'dana-client',
    });
    expect(result.stream).toBe(stream);
  });

  it('deletes an owned completed file from MinIO and the database', async () => {
    const upload = Object.assign(new Upload(), {
      uploadId: 'upload-id',
      fileId: 'file-id',
      username: 'khashayar',
      status: UploadStatus.COMPLETED,
      objectName: 'khashayar/upload/file.pdf',
      bucket: 'dana-client',
    });
    const deleteUpload = jest.fn().mockResolvedValue({ affected: 1 });
    const removeObject = jest.fn().mockResolvedValue(undefined);
    const service = new UploadsService(
      { findOneBy: jest.fn().mockResolvedValue(upload), delete: deleteUpload } as unknown as Repository<Upload>,
      {} as Repository<Project>,
      {} as RabbitMqService,
      { remove: removeObject } as unknown as MinioService,
      {} as LogManager,
      { translate: (key: string) => key } as I18nMessageService,
      new ConfigService({ MINIO_BUCKET: 'dana-client' })
    );

    await expect(service.remove('file-id', 'khashayar')).resolves.toBeUndefined();
    expect(removeObject).toHaveBeenCalledWith('khashayar/upload/file.pdf', 'dana-client');
    expect(deleteUpload).toHaveBeenCalledWith('upload-id');
  });

  it('does not delete a file while its upload job is active', async () => {
    const upload = Object.assign(new Upload(), {
      uploadId: 'upload-id',
      fileId: 'file-id',
      username: 'khashayar',
      status: UploadStatus.PROCESSING,
    });
    const deleteUpload = jest.fn();
    const service = new UploadsService(
      { findOneBy: jest.fn().mockResolvedValue(upload), delete: deleteUpload } as unknown as Repository<Upload>,
      {} as Repository<Project>,
      {} as RabbitMqService,
      {} as MinioService,
      {} as LogManager,
      { translate: (key: string) => key } as I18nMessageService,
      new ConfigService({ MINIO_BUCKET: 'dana-client' })
    );

    await expect(service.remove('file-id', 'khashayar')).rejects.toMatchObject({ status: 409, message: 'upload.deleteInProgress' });
    expect(deleteUpload).not.toHaveBeenCalled();
  });

  it('renames an owned file without changing its original name or object', async () => {
    const upload = Object.assign(new Upload(), {
      fileId: 'file-id',
      username: 'khashayar',
      filename: 'old.pdf',
      originalName: 'original.pdf',
      objectName: 'khashayar/upload/original.pdf',
      size: 100,
      mimeType: 'application/pdf',
      state: FileState.DONE,
      tag: FileTag.USER,
      uploadedAt: new Date(),
    });
    const save = jest.fn((value: Upload) => Promise.resolve(value));
    const service = new UploadsService(
      { findOneBy: jest.fn().mockResolvedValue(upload), save } as unknown as Repository<Upload>,
      {} as Repository<Project>,
      {} as RabbitMqService,
      {} as MinioService,
      {} as LogManager,
      { translate: (key: string) => key } as I18nMessageService,
      new ConfigService({ MINIO_BUCKET: 'dana-client' })
    );

    await expect(service.rename('file-id', ' گزارش جدید.pdf ', 'khashayar')).resolves.toMatchObject({
      fileId: 'file-id',
      filename: 'گزارش جدید.pdf',
      originalName: 'original.pdf',
    });
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({
        filename: 'گزارش جدید.pdf',
        originalName: 'original.pdf',
        objectName: 'khashayar/upload/original.pdf',
      })
    );
  });

  it('registers an AI object as a new file without changing the user object', async () => {
    const sourceFile = Object.assign(new Upload(), {
      fileId: 'user-file',
      username: 'khashayar',
      bucket: 'dana-client',
      objectName: 'khashayar/source.pdf',
      tag: FileTag.USER,
      historyId: 'history-id',
    });
    const uploadsRepository = {
      findOneBy: jest.fn().mockResolvedValueOnce(null).mockResolvedValueOnce(sourceFile),
      create: jest.fn((value: Partial<Upload>) => Object.assign(new Upload(), value)),
      save: jest.fn((value: Upload) => Promise.resolve(value)),
    } as unknown as Repository<Upload>;
    const setTag = jest.fn();
    const minioService = {
      stat: jest.fn().mockResolvedValue({
        size: 2048,
        metaData: { 'content-type': 'application/pdf' },
      }),
      getTag: jest.fn().mockResolvedValue(FileTag.AI),
      getFullPath: jest.fn().mockReturnValue('minio://dana-client/khashayar/result.pdf'),
      setTag,
    } as unknown as MinioService;
    const service = new UploadsService(
      uploadsRepository,
      {} as Repository<Project>,
      {} as RabbitMqService,
      minioService,
      {
        info: jest.fn(),
      } as unknown as LogManager,
      {
        translate: (key: string) => key,
      } as I18nMessageService,
      new ConfigService({ MINIO_BUCKET: 'dana-client' })
    );

    const result = await service.registerAiFile({
      username: 'khashayar',
      fileId: 'ai-file',
      sourceFileId: 'user-file',
      bucket: 'dana-client',
      objectName: 'khashayar/result.pdf',
      filename: 'result.pdf',
    });

    expect(result).toMatchObject({
      fileId: 'ai-file',
      sourceFileId: 'user-file',
      historyId: 'history-id',
      tag: FileTag.AI,
      status: UploadStatus.COMPLETED,
      state: FileState.DONE,
    });
    expect(setTag).not.toHaveBeenCalled();
    expect(sourceFile.tag).toBe(FileTag.USER);
  });
});
