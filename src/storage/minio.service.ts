import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'minio';
import type { Readable } from 'node:stream';
import { LogManager } from '../common/logger/log-manager.service';
import { InfrastructureUnavailableException } from '../error/exceptions/infrastructure-unavailable.exception';
import { FileTag } from './enums/file-tag.enum';
import type { StoredObject } from './interfaces/stored-object.interface';
import type { UploadStorage } from './interfaces/upload-storage.interface';
import { userObjectName } from './utils/user-object-name';

@Injectable()
export class MinioService implements UploadStorage {
  private readonly bucket: string;
  private readonly client: Client;

  constructor(
    configService: ConfigService,
    private readonly logger: LogManager
  ) {
    this.bucket = configService.get<string>('MINIO_BUCKET', 'dana-client');
    this.client = new Client({
      endPoint: configService.get<string>('MINIO_ENDPOINT', 'localhost'),
      port: Number(configService.get<number>('MINIO_PORT', 9002)),
      useSSL: configService.get<string>('MINIO_USE_SSL', 'false') === 'true',
      accessKey: configService.get<string>('MINIO_ACCESS_KEY', 'minioadmin'),
      secretKey: configService.get<string>('MINIO_SECRET_KEY', 'minioadmin'),
    });
  }

  async upload(filePath: string, objectName: string, mimeType: string, bucket = this.bucket, tag = FileTag.USER): Promise<void> {
    const startedAt = Date.now();
    this.logger.info(MinioService.name, 'MinIO upload started', {
      bucket,
      objectName,
      mimeType,
      tag,
    });
    await this.execute(async () => {
      await this.ensureBucket(bucket);
      await this.client.fPutObject(bucket, objectName, filePath, {
        'Content-Type': mimeType,
      });
      await this.client.setObjectTagging(bucket, objectName, { tag });
    });
    this.logger.info(MinioService.name, 'MinIO upload completed', {
      bucket,
      objectName,
      durationMs: Date.now() - startedAt,
    });
  }

  async remove(objectName: string, bucket = this.bucket): Promise<void> {
    await this.execute(() => this.client.removeObject(bucket, objectName));
    this.logger.info(MinioService.name, 'MinIO object removed', {
      bucket,
      objectName,
    });
  }

  async preview(objectName: string, bucket = this.bucket): Promise<{ stream: Readable; size: number }> {
    this.logger.trace(MinioService.name, 'MinIO preview requested', {
      bucket,
      objectName,
    });
    const stat = await this.execute(() => this.client.statObject(bucket, objectName));
    const stream = await this.execute(() => this.client.getObject(bucket, objectName));
    return { stream, size: stat.size };
  }

  async stat(objectName: string, bucket = this.bucket) {
    return this.execute(() => this.client.statObject(bucket, objectName));
  }

  async setTag(objectName: string, tag: FileTag, bucket = this.bucket): Promise<void> {
    await this.execute(() => this.client.setObjectTagging(bucket, objectName, { tag }));
  }

  async getTag(objectName: string, bucket = this.bucket): Promise<string | undefined> {
    const tags = await this.execute(() => this.client.getObjectTagging(bucket, objectName));
    return tags.find(({ Key }) => Key === 'tag')?.Value;
  }

  getFullPath(objectName: string, bucket = this.bucket): string {
    return `minio://${bucket}/${objectName}`;
  }

  getDefaultBucket(): string {
    return this.bucket;
  }

  async findUserObject(fileId: string, username: string, buckets = [this.bucket, 'dana-client']): Promise<StoredObject | undefined> {
    const prefix = `${userObjectName(username)}/`;
    for (const bucket of [...new Set(buckets)]) {
      const objectName = await this.execute(() => this.findObjectName(bucket, prefix, fileId));
      if (!objectName) {
        continue;
      }
      const stat = await this.execute(() => this.client.statObject(bucket, objectName));
      const mimeType = this.metadataValue(stat.metaData, 'content-type') ?? 'application/octet-stream';
      return { bucket, objectName, size: stat.size, mimeType };
    }
    return undefined;
  }

  private async ensureBucket(bucket: string): Promise<void> {
    if (!(await this.client.bucketExists(bucket))) {
      try {
        await this.client.makeBucket(bucket);
      } catch (error) {
        if (!(await this.client.bucketExists(bucket))) {
          throw error;
        }
      }
    }
  }

  private findObjectName(bucket: string, prefix: string, fileId: string): Promise<string | undefined> {
    return new Promise((resolve, reject) => {
      const objects = this.client.listObjectsV2(bucket, prefix, true);
      let found: string | undefined;
      objects.on('data', (object) => {
        if (!found && object.name?.split('/').includes(fileId)) {
          found = object.name;
        }
      });
      objects.on('error', reject);
      objects.on('end', () => resolve(found));
    });
  }

  private metadataValue(metadata: unknown, key: string): string | undefined {
    if (!metadata || typeof metadata !== 'object') {
      return undefined;
    }
    const entries = Object.entries(metadata as Record<string, unknown>);
    const value = entries.find(([name]) => name.toLowerCase() === key)?.[1];
    return typeof value === 'string' ? value : undefined;
  }

  private async execute<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof InfrastructureUnavailableException) {
        throw error;
      }
      throw new InfrastructureUnavailableException('MinIO', 'MINIO_UNAVAILABLE', error);
    }
  }
}
