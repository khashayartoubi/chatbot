import type { Readable } from 'node:stream';
import type { FileTag } from '../enums/file-tag.enum';
import type { StoredObject } from './stored-object.interface';
export interface UploadObjectStat {
    size: number;
    metaData: unknown;
}
export interface UploadStorage {
    upload(filePath: string, objectName: string, mimeType: string, bucket?: string, tag?: FileTag): Promise<void>;
    remove(objectName: string, bucket?: string): Promise<void>;
    preview(objectName: string, bucket?: string): Promise<{
        stream: Readable;
        size: number;
    }>;
    stat(objectName: string, bucket?: string): Promise<UploadObjectStat>;
    getTag(objectName: string, bucket?: string): Promise<string | undefined>;
    getFullPath(objectName: string, bucket?: string): string;
    getDefaultBucket(): string;
    findUserObject(fileId: string, username: string, buckets?: string[]): Promise<StoredObject | undefined>;
}
