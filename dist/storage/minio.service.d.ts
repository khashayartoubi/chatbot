import { ConfigService } from '@nestjs/config';
import type { Readable } from 'node:stream';
import { LogManager } from '../common/logger/log-manager.service';
import { FileTag } from './enums/file-tag.enum';
import type { StoredObject } from './interfaces/stored-object.interface';
import type { UploadStorage } from './interfaces/upload-storage.interface';
export declare class MinioService implements UploadStorage {
    private readonly logger;
    private readonly bucket;
    private readonly client;
    constructor(configService: ConfigService, logger: LogManager);
    upload(filePath: string, objectName: string, mimeType: string, bucket?: string, tag?: FileTag): Promise<void>;
    remove(objectName: string, bucket?: string): Promise<void>;
    preview(objectName: string, bucket?: string): Promise<{
        stream: Readable;
        size: number;
    }>;
    stat(objectName: string, bucket?: string): Promise<import("minio").BucketItemStat>;
    setTag(objectName: string, tag: FileTag, bucket?: string): Promise<void>;
    getTag(objectName: string, bucket?: string): Promise<string | undefined>;
    getFullPath(objectName: string, bucket?: string): string;
    getDefaultBucket(): string;
    findUserObject(fileId: string, username: string, buckets?: string[]): Promise<StoredObject | undefined>;
    private ensureBucket;
    private findObjectName;
    private metadataValue;
    private execute;
}
