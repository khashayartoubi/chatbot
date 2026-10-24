import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { unlink } from 'node:fs/promises';
import { randomInt } from 'node:crypto';
import { In, IsNull, Repository } from 'typeorm';
import { I18nMessageService } from '../common/i18n/i18n-message.service';
import { LogManager } from '../common/logger/log-manager.service';
import { Project } from '../projects/entities/project.entity';
import { normalizeFileName } from '../common/utils/normalize-file-name';
import { Upload } from './entities/upload.entity';
import { UploadStatus } from './enums/upload-status.enum';
import { FileState } from './enums/file-state.enum';
import { FileTag } from '../storage/enums/file-tag.enum';
import type { StoredObject } from '../storage/interfaces/stored-object.interface';
import type { UploadObjectStat, UploadStorage } from '../storage/interfaces/upload-storage.interface';
import { RegisterAiFileDto } from './dto/register-ai-file.dto';
import { RabbitMqService } from '../queue/rabbitmq.service';
import { MinioService } from '../storage/minio.service';
import { userObjectName } from '../storage/utils/user-object-name';
import type { UploadStreamResult } from './interfaces/upload-stream-result.interface';
import { InfrastructureUnavailableException } from '../error/exceptions/infrastructure-unavailable.exception';

@Injectable()
export class UploadsService {
  private readonly streamBucket: string;

  constructor(
    @InjectRepository(Upload)
    private readonly uploadsRepository: Repository<Upload>,
    @InjectRepository(Project)
    private readonly projectsRepository: Repository<Project>,
    private readonly rabbitMqService: RabbitMqService,
    @Inject(MinioService)
    private readonly minioService: UploadStorage,
    private readonly logger: LogManager,
    private readonly messages: I18nMessageService,
    private readonly configService: ConfigService
  ) {
    this.streamBucket = this.configService.get<string>('MINIO_BUCKET', 'dana-client');
  }

  async create(files: Express.Multer.File[], username: string, collectionId?: string, historyId?: string) {
    this.logger.info(UploadsService.name, 'Queued upload request started', {
      username,
      fileCount: files.length,
      scope: collectionId ? 'project' : 'general',
      collectionId,
      historyId,
    });
    let projectId: string | undefined;
    try {
      projectId = await this.resolveProjectId(collectionId, username);
    } catch (error) {
      await this.removeFiles(files);
      throw error;
    }
    let uploads: Upload[];
    try {
      uploads = await this.uploadsRepository.save(
        files.map((file) => {
          const filename = normalizeFileName(file.originalname);
          return this.uploadsRepository.create({
            username,
            projectId,
            historyId: projectId ? undefined : historyId,
            sessionId: projectId ? historyId : undefined,
            fileId: this.createFileId(),
            filename,
            originalName: filename,
            mimeType: file.mimetype,
            size: file.size,
            bucket: this.minioService.getDefaultBucket(),
            tag: FileTag.USER,
          });
        })
      );
    } catch {
      await this.removeFiles(files);
      throw new ServiceUnavailableException(this.messages.translate('common.databaseUnavailable'));
    }

    try {
      await Promise.all(
        uploads.map((upload, index) => {
          const file = files[index];
          if (!file) {
            throw new Error(this.messages.translate('upload.tempFileMissing'));
          }
          return this.rabbitMqService.publish({
            uploadId: upload.uploadId,
            tempPath: file.path,
          });
        })
      );
    } catch (error) {
      await Promise.all(
        uploads.map(async (upload) => {
          upload.status = UploadStatus.FAILED;
          upload.state = FileState.FAILURE;
          upload.error = this.messages.translate('upload.queueUnavailable');
          await this.uploadsRepository.save(upload).catch(() => undefined);
        })
      );
      await this.removeFiles(files);
      if (error instanceof InfrastructureUnavailableException) {
        throw error;
      }
      throw new ServiceUnavailableException(this.messages.translate('upload.queueUnavailable'));
    }

    this.logger.info(UploadsService.name, 'Upload jobs queued', {
      username,
      fileCount: uploads.length,
      scope: projectId ? 'project' : 'general',
    });
    return uploads.map((upload) => this.toFile(upload));
  }

  async discardTemporaryFiles(files: Express.Multer.File[]): Promise<void> {
    await this.removeFiles(files);
  }

  async createForStream(files: Express.Multer.File[], username: string, historyId: string, projectId?: string): Promise<Upload[]> {
    if (!files.length) {
      return [];
    }

    this.logger.info(UploadsService.name, 'Stream file upload started', {
      username,
      historyId,
      fileCount: files.length,
      scope: projectId ? 'project' : 'general',
      bucket: this.streamBucket,
    });
    let uploads: Upload[];
    try {
      uploads = await this.uploadsRepository.save(
        files.map((file) => {
          const filename = normalizeFileName(file.originalname);
          return this.uploadsRepository.create({
            username,
            projectId,
            historyId: projectId ? undefined : historyId,
            sessionId: projectId ? historyId : undefined,
            fileId: this.createFileId(),
            filename,
            originalName: filename,
            mimeType: file.mimetype,
            size: file.size,
            bucket: this.streamBucket,
            tag: FileTag.USER,
            status: UploadStatus.PROCESSING,
          });
        })
      );
    } catch {
      await this.removeFiles(files);
      throw new ServiceUnavailableException(this.messages.translate('common.databaseUnavailable'));
    }

    let failureMessage = this.messages.translate('common.minioUnavailable');
    try {
      const results = await Promise.allSettled(
        uploads.map(async (upload, index) => {
          const file = files[index];
          if (!file) {
            throw new Error(this.messages.translate('upload.tempFileMissing'));
          }
          const safeName = normalizeFileName(upload.originalName);
          upload.objectName = userObjectName(upload.username, 'attachments', upload.fileId, safeName);
          await this.minioService.upload(file.path, upload.objectName, upload.mimeType, upload.bucket, upload.tag);
          upload.fullPath = this.minioService.getFullPath(upload.objectName, upload.bucket);
          upload.status = UploadStatus.COMPLETED;
          upload.state = FileState.DONE;
        })
      );
      const failedUpload = results.find((result) => result.status === 'rejected');
      if (failedUpload?.status === 'rejected') {
        throw failedUpload.reason;
      }

      failureMessage = this.messages.translate('common.databaseUnavailable');
      const savedUploads = await this.uploadsRepository.save(uploads);
      this.logger.info(UploadsService.name, 'Stream file upload completed', {
        username,
        historyId,
        fileCount: savedUploads.length,
        bucket: this.streamBucket,
      });
      return savedUploads;
    } catch (error) {
      this.logger.failure(UploadsService.name, 'Stream file upload failed', error, {
        username,
        historyId,
        fileCount: uploads.length,
        reason: failureMessage,
      });
      await Promise.all(uploads.filter((upload) => upload.objectName).map((upload) => this.minioService.remove(upload.objectName!, upload.bucket).catch(() => undefined)));
      await this.uploadsRepository.delete({ uploadId: In(uploads.map((upload) => upload.uploadId)) }).catch(() => undefined);
      throw new ServiceUnavailableException(failureMessage);
    } finally {
      await this.removeFiles(files);
    }
  }

  async findAll(username: string, collectionId?: string) {
    const projectId = await this.resolveProjectId(collectionId, username);
    try {
      const uploads = await this.uploadsRepository.find({
        where: {
          username,
          projectId: projectId ?? IsNull(),
        },
        order: { createdAt: 'DESC' },
      });
      return uploads.map((upload) => this.toFile(upload));
    } catch {
      throw new ServiceUnavailableException(this.messages.translate('common.databaseUnavailable'));
    }
  }

  async registerAiFile(dto: RegisterAiFileDto): Promise<Upload> {
    this.logger.info(UploadsService.name, 'AI file registration started', {
      username: dto.username,
      fileId: dto.fileId,
      sourceFileId: dto.sourceFileId,
      bucket: dto.bucket,
    });
    let existingFile: Upload | null;
    let sourceFile: Upload | null;
    try {
      [existingFile, sourceFile] = await Promise.all([
        this.uploadsRepository.findOneBy({
          fileId: dto.fileId,
          username: dto.username,
        }),
        this.uploadsRepository.findOneBy({
          fileId: dto.sourceFileId,
          username: dto.username,
          tag: FileTag.USER,
        }),
      ]);
    } catch {
      throw new ServiceUnavailableException(this.messages.translate('common.databaseUnavailable'));
    }

    if (existingFile) {
      throw new ConflictException(this.messages.translate('upload.aiDuplicate'));
    }
    if (!sourceFile) {
      throw new NotFoundException(this.messages.translate('upload.sourceNotFound'));
    }
    if (sourceFile.objectName === dto.objectName && sourceFile.bucket === dto.bucket) {
      throw new ConflictException(this.messages.translate('upload.aiMustBeNew'));
    }

    let stat: UploadObjectStat;
    try {
      stat = await this.minioService.stat(dto.objectName, dto.bucket);
      const minioTag = await this.minioService.getTag(dto.objectName, dto.bucket);
      if (minioTag !== FileTag.AI) {
        throw new ConflictException(this.messages.translate('upload.invalidAiTag'));
      }
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new ServiceUnavailableException(this.messages.translate('upload.aiObjectNotFound'));
    }

    const upload = this.uploadsRepository.create({
      username: dto.username,
      fileId: dto.fileId,
      sourceFileId: sourceFile.fileId,
      projectId: sourceFile.projectId,
      historyId: sourceFile.historyId,
      sessionId: sourceFile.sessionId,
      filename: normalizeFileName(dto.filename),
      originalName: normalizeFileName(dto.originalName ?? dto.filename),
      mimeType: dto.mimeType ?? this.getMetadataString(stat.metaData, 'content-type') ?? 'application/octet-stream',
      size: dto.size ?? stat.size,
      bucket: dto.bucket,
      objectName: dto.objectName,
      fullPath: this.minioService.getFullPath(dto.objectName, dto.bucket),
      tag: FileTag.AI,
      status: UploadStatus.COMPLETED,
      state: FileState.DONE,
      uploadedAt: new Date(),
    });
    try {
      const savedUpload = await this.uploadsRepository.save(upload);
      this.logger.info(UploadsService.name, 'AI file registered', {
        username: dto.username,
        fileId: dto.fileId,
        sourceFileId: dto.sourceFileId,
        bucket: dto.bucket,
      });
      return savedUpload;
    } catch {
      throw new ServiceUnavailableException(this.messages.translate('common.databaseUnavailable'));
    }
  }

  async registerGeneratedAiFile(username: string, objectName: string, bucket: string, historyId: string, projectId?: string): Promise<Upload> {
    const normalizedObjectName = objectName.trim();
    const normalizedBucket = bucket.trim();
    if (!normalizedBucket || !normalizedObjectName.startsWith(`${userObjectName(username)}/`)) {
      throw new BadRequestException(this.messages.translate('upload.aiObjectNotFound'));
    }

    let stat: UploadObjectStat;
    try {
      stat = await this.minioService.stat(normalizedObjectName, normalizedBucket);
    } catch {
      throw new ServiceUnavailableException(this.messages.translate('upload.aiObjectNotFound'));
    }

    const filename = normalizeFileName(normalizedObjectName.split('/').at(-1) || 'generated-file');
    const upload = this.uploadsRepository.create({
      username,
      fileId: this.createFileId(),
      projectId,
      historyId: projectId ? undefined : historyId,
      sessionId: projectId ? historyId : undefined,
      filename,
      originalName: filename,
      mimeType: this.getMetadataString(stat.metaData, 'content-type') ?? 'application/octet-stream',
      size: stat.size,
      bucket: normalizedBucket,
      objectName: normalizedObjectName,
      fullPath: this.minioService.getFullPath(normalizedObjectName, normalizedBucket),
      tag: FileTag.AI,
      status: UploadStatus.COMPLETED,
      state: FileState.DONE,
      uploadedAt: new Date(),
    });

    try {
      return await this.uploadsRepository.save(upload);
    } catch {
      throw new ServiceUnavailableException(this.messages.translate('common.databaseUnavailable'));
    }
  }

  async findOne(fileId: string, username: string) {
    const upload = await this.findOwnedFile(fileId, username);
    return this.toFile(upload);
  }

  async rename(fileId: string, filename: string, username: string) {
    const upload = await this.findOwnedFile(fileId, username);
    upload.filename = normalizeFileName(filename);
    try {
      return this.toFile(await this.uploadsRepository.save(upload));
    } catch {
      throw new ServiceUnavailableException(this.messages.translate('common.databaseUnavailable'));
    }
  }

  async remove(fileId: string, username: string): Promise<void> {
    const upload = await this.findOwnedFile(fileId, username);
    if (upload.status === UploadStatus.QUEUED || upload.status === UploadStatus.PROCESSING) {
      throw new ConflictException(this.messages.translate('upload.deleteInProgress'));
    }
    if (upload.objectName) {
      try {
        await this.minioService.remove(upload.objectName, upload.bucket);
      } catch {
        throw new ServiceUnavailableException(this.messages.translate('common.minioUnavailable'));
      }
    }
    try {
      await this.uploadsRepository.delete(upload.uploadId);
    } catch {
      throw new ServiceUnavailableException(this.messages.translate('common.databaseUnavailable'));
    }
  }

  async preview(fileId: string, username: string): Promise<UploadStreamResult> {
    const upload = await this.findOwnedFile(fileId, username);
    if (upload.state !== FileState.DONE || !upload.objectName) {
      throw new ConflictException(this.messages.translate('upload.previewNotReady'));
    }

    try {
      const object = await this.minioService.preview(upload.objectName, upload.bucket);
      return { upload, ...object };
    } catch {
      throw new ServiceUnavailableException(this.messages.translate('common.minioUnavailable'));
    }
  }

  async download(fileId: string, username: string): Promise<UploadStreamResult> {
    try {
      return await this.preview(fileId, username);
    } catch (error) {
      if (!(error instanceof NotFoundException)) {
        throw error;
      }
    }

    let storedObject: StoredObject | undefined;
    try {
      storedObject = await this.minioService.findUserObject(fileId, username);
    } catch {
      throw new ServiceUnavailableException(this.messages.translate('common.minioUnavailable'));
    }
    if (!storedObject) {
      throw new NotFoundException(this.messages.translate('upload.notFound'));
    }

    const filename = storedObject.objectName.split('/').at(-1) ?? fileId;
    const upload = Object.assign(new Upload(), {
      fileId,
      username,
      filename,
      originalName: filename,
      mimeType: storedObject.mimeType,
      size: storedObject.size,
      bucket: storedObject.bucket,
      objectName: storedObject.objectName,
      fullPath: this.minioService.getFullPath(storedObject.objectName, storedObject.bucket),
      status: UploadStatus.COMPLETED,
      state: FileState.DONE,
    });
    const object = await this.minioService.preview(storedObject.objectName, storedObject.bucket);
    return { upload, ...object };
  }

  async findAttachments(uploadIds: string[], username: string, projectId?: string, conversationId?: string): Promise<Upload[]> {
    if (!uploadIds.length) {
      return [];
    }

    let uploads: Upload[];
    try {
      const baseWhere = {
        fileId: In(uploadIds),
        username,
        projectId: projectId ?? IsNull(),
        status: UploadStatus.COMPLETED,
      };
      const where = !conversationId
        ? baseWhere
        : projectId
          ? [
              { ...baseWhere, sessionId: conversationId },
              { ...baseWhere, sessionId: IsNull() },
            ]
          : [
              { ...baseWhere, historyId: conversationId },
              { ...baseWhere, historyId: IsNull() },
            ];
      uploads = await this.uploadsRepository.find({ where });
    } catch {
      throw new ServiceUnavailableException(this.messages.translate('common.databaseUnavailable'));
    }

    if (uploads.length !== new Set(uploadIds).size) {
      throw new NotFoundException(this.messages.translate('upload.attachmentsNotFound'));
    }

    if (conversationId) {
      try {
        await this.uploadsRepository.update({ fileId: In(uploadIds), username }, projectId ? { sessionId: conversationId } : { historyId: conversationId });
        uploads.forEach((upload) => {
          if (projectId) {
            upload.sessionId = conversationId;
          } else {
            upload.historyId = conversationId;
          }
        });
      } catch {
        throw new ServiceUnavailableException(this.messages.translate('common.databaseUnavailable'));
      }
    }

    return uploads;
  }

  async findHistoryFiles(username: string, historyId: string, projectId?: string) {
    try {
      const uploads = await this.uploadsRepository.find({
        where: {
          username,
          projectId: projectId ?? IsNull(),
          ...(projectId ? { sessionId: historyId } : { historyId }),
        },
        order: { createdAt: 'DESC' },
      });
      return uploads.map((upload) => this.toFile(upload));
    } catch {
      throw new ServiceUnavailableException(this.messages.translate('common.databaseUnavailable'));
    }
  }

  async removeByProject(projectId: string): Promise<void> {
    let uploads: Upload[];
    try {
      uploads = await this.uploadsRepository.findBy({ projectId });
    } catch {
      throw new ServiceUnavailableException(this.messages.translate('common.databaseUnavailable'));
    }

    try {
      await Promise.all(uploads.filter((upload) => upload.objectName).map((upload) => this.minioService.remove(upload.objectName!, upload.bucket)));
    } catch {
      throw new ServiceUnavailableException(this.messages.translate('common.minioUnavailable'));
    }

    try {
      await this.uploadsRepository.delete({ projectId });
    } catch {
      throw new ServiceUnavailableException(this.messages.translate('common.databaseUnavailable'));
    }
  }

  async removeByHistory(username: string, historyId: string, projectId?: string): Promise<void> {
    let uploads: Upload[];
    try {
      uploads = await this.uploadsRepository.find({
        where: {
          username,
          projectId: projectId ?? IsNull(),
          ...(projectId ? { sessionId: historyId } : { historyId }),
        },
      });
    } catch {
      throw new ServiceUnavailableException(this.messages.translate('common.databaseUnavailable'));
    }

    try {
      await Promise.all(uploads.filter((upload) => upload.objectName).map((upload) => this.minioService.remove(upload.objectName!, upload.bucket)));
    } catch {
      throw new ServiceUnavailableException(this.messages.translate('common.minioUnavailable'));
    }

    try {
      await this.uploadsRepository.remove(uploads);
    } catch {
      throw new ServiceUnavailableException(this.messages.translate('common.databaseUnavailable'));
    }
  }

  private async removeFiles(files: Express.Multer.File[]): Promise<void> {
    await Promise.all(files.map((file) => unlink(file.path).catch(() => undefined)));
  }

  private createFileId(): string {
    return randomInt(10_000_000_000_000, 99_999_999_999_999).toString();
  }

  private getMetadataString(metadata: unknown, key: string): string | undefined {
    if (typeof metadata !== 'object' || metadata === null || Array.isArray(metadata)) {
      return undefined;
    }
    const value = (metadata as Record<string, unknown>)[key];
    return typeof value === 'string' ? value : undefined;
  }

  private async findOwnedFile(fileId: string, username: string): Promise<Upload> {
    let upload: Upload | null;
    try {
      upload = await this.uploadsRepository.findOneBy({ fileId, username });
    } catch {
      throw new ServiceUnavailableException(this.messages.translate('common.databaseUnavailable'));
    }

    if (!upload) {
      throw new NotFoundException(this.messages.translate('upload.notFound'));
    }
    return upload;
  }

  private toFile(upload: Upload) {
    return {
      user_name: upload.username,
      fileId: upload.fileId,
      filename: upload.filename,
      originalName: upload.originalName,
      size: Number(upload.size),
      mimeType: upload.mimeType,
      fullPath: upload.fullPath ?? '',
      uploadedAt: upload.uploadedAt,
      state: upload.state,
      tag: upload.tag,
      sourceFileId: upload.sourceFileId ?? null,
    };
  }

  private async resolveProjectId(collectionId: string | undefined, username: string): Promise<string | undefined> {
    if (!collectionId) {
      return undefined;
    }

    let project: Project | null;
    try {
      project = await this.projectsRepository.findOneBy({
        collectionId,
        username,
      });
    } catch {
      throw new ServiceUnavailableException(this.messages.translate('common.databaseUnavailable'));
    }

    if (!project) {
      throw new NotFoundException(this.messages.translate('project.notFound'));
    }
    return project.id;
  }
}
