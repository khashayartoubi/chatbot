import { Injectable, OnApplicationBootstrap, OnModuleDestroy } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { ConfirmChannel, ConsumeMessage } from 'amqplib';
import { unlink } from 'node:fs/promises';
import { Repository } from 'typeorm';
import { LogManager } from '../common/logger/log-manager.service';
import { I18nMessageService } from '../common/i18n/i18n-message.service';
import { normalizeFileName } from '../common/utils/normalize-file-name';
import { MinioService } from '../storage/minio.service';
import { userObjectName } from '../storage/utils/user-object-name';
import { Upload } from '../uploads/entities/upload.entity';
import { FileState } from '../uploads/enums/file-state.enum';
import { UploadStatus } from '../uploads/enums/upload-status.enum';
import type { UploadJob } from './interfaces/upload-job.interface';
import { RabbitMqService } from './rabbitmq.service';

@Injectable()
export class UploadWorker implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly jobRetryTimers = new Set<NodeJS.Timeout>();
  private retryTimer?: NodeJS.Timeout;

  constructor(
    @InjectRepository(Upload)
    private readonly uploadsRepository: Repository<Upload>,
    private readonly rabbitMqService: RabbitMqService,
    private readonly minioService: MinioService,
    private readonly logger: LogManager,
    private readonly messages: I18nMessageService
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.startConsumer();
  }

  onModuleDestroy(): void {
    clearTimeout(this.retryTimer);
    this.jobRetryTimers.forEach((timer) => clearTimeout(timer));
    this.jobRetryTimers.clear();
  }

  private async startConsumer(): Promise<void> {
    try {
      const channel = await this.rabbitMqService.getChannel();
      await channel.prefetch(3);
      await channel.consume(this.rabbitMqService.queueName, (message) => void this.process(message));
      this.logger.info(UploadWorker.name, 'Upload worker is ready', {
        queue: this.rabbitMqService.queueName,
        prefetch: 3,
      });
    } catch (error) {
      this.logger.failure(UploadWorker.name, 'RabbitMQ is unavailable; retrying worker', error, {
        retryAfterMs: 5_000,
      });
      this.retryTimer = setTimeout(() => void this.startConsumer(), 5_000);
    }
  }

  private async process(message: ConsumeMessage | null): Promise<void> {
    if (!message) {
      return;
    }

    const channel = await this.rabbitMqService.getChannel();
    let job: UploadJob | undefined;
    let failureMessage = this.messages.translate('upload.processingFailed');

    try {
      job = JSON.parse(message.content.toString()) as UploadJob;
      const upload = await this.uploadsRepository.findOneBy({
        uploadId: job.uploadId,
      });

      if (!upload) {
        this.logger.warning(UploadWorker.name, 'Upload job ignored because its record was not found', {
          uploadId: job.uploadId,
        });
        channel.ack(message);
        return;
      }

      const startedAt = Date.now();
      this.logger.info(UploadWorker.name, 'Upload job processing started', {
        uploadId: upload.uploadId,
        fileId: upload.fileId,
        bucket: upload.bucket,
      });
      upload.status = UploadStatus.PROCESSING;
      await this.uploadsRepository.save(upload);

      failureMessage = this.messages.translate('common.minioUnavailable');
      const safeName = normalizeFileName(upload.originalName);
      upload.objectName = userObjectName(upload.username, 'attachments', upload.fileId, safeName);
      await this.minioService.upload(job.tempPath, upload.objectName, upload.mimeType, upload.bucket, upload.tag);

      failureMessage = this.messages.translate('common.databaseUnavailable');
      upload.fullPath = this.minioService.getFullPath(upload.objectName, upload.bucket);
      upload.status = UploadStatus.COMPLETED;
      upload.state = FileState.DONE;
      upload.error = undefined;
      await this.uploadsRepository.save(upload);
      await unlink(job.tempPath).catch(() => undefined);
      channel.ack(message);
      this.logger.info(UploadWorker.name, 'Upload job completed', {
        uploadId: upload.uploadId,
        fileId: upload.fileId,
        bucket: upload.bucket,
        durationMs: Date.now() - startedAt,
      });
    } catch (error) {
      if (!job) {
        await this.markAsFailed(job, error, failureMessage);
        channel.ack(message);
        return;
      }
      await this.retry(job, message, channel, error, failureMessage);
    }
  }

  private async retry(job: UploadJob, message: ConsumeMessage, channel: ConfirmChannel, error: unknown, reason: string): Promise<void> {
    const retryAfterMs = 5_000;
    this.logger.failure(UploadWorker.name, 'Upload job postponed until infrastructure is available', error, {
      uploadId: job.uploadId,
      reason,
      retryAfterMs,
    });

    await this.uploadsRepository
      .update(job.uploadId, {
        status: UploadStatus.QUEUED,
        state: FileState.PENDING,
        error: reason,
      })
      .catch((databaseError: unknown) => {
        this.logger.warning(UploadWorker.name, 'PostgreSQL is unavailable; upload job remains in RabbitMQ', {
          uploadId: job.uploadId,
          error: databaseError instanceof Error ? databaseError.message : String(databaseError),
        });
      });

    const timer = setTimeout(() => {
      this.jobRetryTimers.delete(timer);
      try {
        channel.nack(message, false, true);
      } catch {
        // RabbitMQ automatically requeues unacknowledged jobs when the channel reconnects.
      }
    }, retryAfterMs);
    this.jobRetryTimers.add(timer);
  }

  private async markAsFailed(job: UploadJob | undefined, error: unknown, message: string): Promise<void> {
    this.logger.failure(UploadWorker.name, 'Upload job failed', error, {
      uploadId: job?.uploadId,
      reason: message,
    });

    if (!job) {
      return;
    }

    await this.uploadsRepository
      .update(job.uploadId, {
        status: UploadStatus.FAILED,
        state: FileState.FAILURE,
        error: message,
      })
      .catch((databaseError: unknown) => {
        this.logger.failure(UploadWorker.name, 'Could not update failed upload state in PostgreSQL', databaseError, {
          uploadId: job.uploadId,
        });
      });
    await unlink(job.tempPath).catch(() => undefined);
  }
}
