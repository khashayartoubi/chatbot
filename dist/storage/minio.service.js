"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var MinioService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MinioService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const minio_1 = require("minio");
const log_manager_service_1 = require("../common/logger/log-manager.service");
const infrastructure_unavailable_exception_1 = require("../error/exceptions/infrastructure-unavailable.exception");
const file_tag_enum_1 = require("./enums/file-tag.enum");
const user_object_name_1 = require("./utils/user-object-name");
let MinioService = MinioService_1 = class MinioService {
    logger;
    bucket;
    client;
    constructor(configService, logger) {
        this.logger = logger;
        this.bucket = configService.get('MINIO_BUCKET', 'dana-client');
        this.client = new minio_1.Client({
            endPoint: configService.get('MINIO_ENDPOINT', 'localhost'),
            port: Number(configService.get('MINIO_PORT', 9002)),
            useSSL: configService.get('MINIO_USE_SSL', 'false') === 'true',
            accessKey: configService.get('MINIO_ACCESS_KEY', 'minioadmin'),
            secretKey: configService.get('MINIO_SECRET_KEY', 'minioadmin'),
        });
    }
    async upload(filePath, objectName, mimeType, bucket = this.bucket, tag = file_tag_enum_1.FileTag.USER) {
        const startedAt = Date.now();
        this.logger.info(MinioService_1.name, 'MinIO upload started', {
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
        this.logger.info(MinioService_1.name, 'MinIO upload completed', {
            bucket,
            objectName,
            durationMs: Date.now() - startedAt,
        });
    }
    async remove(objectName, bucket = this.bucket) {
        await this.execute(() => this.client.removeObject(bucket, objectName));
        this.logger.info(MinioService_1.name, 'MinIO object removed', {
            bucket,
            objectName,
        });
    }
    async preview(objectName, bucket = this.bucket) {
        this.logger.trace(MinioService_1.name, 'MinIO preview requested', {
            bucket,
            objectName,
        });
        const stat = await this.execute(() => this.client.statObject(bucket, objectName));
        const stream = await this.execute(() => this.client.getObject(bucket, objectName));
        return { stream, size: stat.size };
    }
    async stat(objectName, bucket = this.bucket) {
        return this.execute(() => this.client.statObject(bucket, objectName));
    }
    async setTag(objectName, tag, bucket = this.bucket) {
        await this.execute(() => this.client.setObjectTagging(bucket, objectName, { tag }));
    }
    async getTag(objectName, bucket = this.bucket) {
        const tags = await this.execute(() => this.client.getObjectTagging(bucket, objectName));
        return tags.find(({ Key }) => Key === 'tag')?.Value;
    }
    getFullPath(objectName, bucket = this.bucket) {
        return `minio://${bucket}/${objectName}`;
    }
    getDefaultBucket() {
        return this.bucket;
    }
    async findUserObject(fileId, username, buckets = [this.bucket, 'dana-client']) {
        const prefix = `${(0, user_object_name_1.userObjectName)(username)}/`;
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
    async ensureBucket(bucket) {
        if (!(await this.client.bucketExists(bucket))) {
            try {
                await this.client.makeBucket(bucket);
            }
            catch (error) {
                if (!(await this.client.bucketExists(bucket))) {
                    throw error;
                }
            }
        }
    }
    findObjectName(bucket, prefix, fileId) {
        return new Promise((resolve, reject) => {
            const objects = this.client.listObjectsV2(bucket, prefix, true);
            let found;
            objects.on('data', (object) => {
                if (!found && object.name?.split('/').includes(fileId)) {
                    found = object.name;
                }
            });
            objects.on('error', reject);
            objects.on('end', () => resolve(found));
        });
    }
    metadataValue(metadata, key) {
        if (!metadata || typeof metadata !== 'object') {
            return undefined;
        }
        const entries = Object.entries(metadata);
        const value = entries.find(([name]) => name.toLowerCase() === key)?.[1];
        return typeof value === 'string' ? value : undefined;
    }
    async execute(operation) {
        try {
            return await operation();
        }
        catch (error) {
            if (error instanceof infrastructure_unavailable_exception_1.InfrastructureUnavailableException) {
                throw error;
            }
            throw new infrastructure_unavailable_exception_1.InfrastructureUnavailableException('MinIO', 'MINIO_UNAVAILABLE', error);
        }
    }
};
exports.MinioService = MinioService;
exports.MinioService = MinioService = MinioService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        log_manager_service_1.LogManager])
], MinioService);
//# sourceMappingURL=minio.service.js.map