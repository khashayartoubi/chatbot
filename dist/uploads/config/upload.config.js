"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadOptions = void 0;
const node_crypto_1 = require("node:crypto");
const node_fs_1 = require("node:fs");
const multer_1 = require("multer");
const tempDirectory = process.env['UPLOAD_TEMP_DIR'] ?? '/tmp/dana-uploads';
exports.uploadOptions = {
    storage: (0, multer_1.diskStorage)({
        destination: (_request, _file, callback) => {
            (0, node_fs_1.mkdir)(tempDirectory, { recursive: true }, (error) => callback(error, tempDirectory));
        },
        filename: (_request, _file, callback) => {
            callback(null, (0, node_crypto_1.randomUUID)());
        },
    }),
    limits: {
        fileSize: Number(process.env['UPLOAD_MAX_FILE_SIZE'] ?? 100 * 1024 * 1024),
        files: Number(process.env['UPLOAD_MAX_FILES'] ?? 10),
    },
};
//# sourceMappingURL=upload.config.js.map