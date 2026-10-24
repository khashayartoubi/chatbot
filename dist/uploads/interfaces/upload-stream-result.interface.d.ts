import type { Readable } from 'node:stream';
import type { Upload } from '../entities/upload.entity';
export interface UploadStreamResult {
    upload: Upload;
    stream: Readable;
    size: number;
}
