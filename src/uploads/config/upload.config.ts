import { randomUUID } from 'node:crypto';
import { mkdir } from 'node:fs';
import { diskStorage } from 'multer';

const tempDirectory = process.env['UPLOAD_TEMP_DIR'] ?? '/tmp/dana-uploads';

export const uploadOptions = {
  storage: diskStorage({
    destination: (_request, _file, callback) => {
      mkdir(tempDirectory, { recursive: true }, (error) => callback(error, tempDirectory));
    },
    filename: (_request, _file, callback) => {
      callback(null, randomUUID());
    },
  }),
  limits: {
    fileSize: Number(process.env['UPLOAD_MAX_FILE_SIZE'] ?? 100 * 1024 * 1024),
    files: Number(process.env['UPLOAD_MAX_FILES'] ?? 10),
  },
};
