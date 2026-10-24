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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var UploadWorker_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadWorker = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const promises_1 = require("node:fs/promises");
const typeorm_2 = require("typeorm");
const log_manager_service_1 = require("../common/logger/log-manager.service");
const i18n_message_service_1 = require("../common/i18n/i18n-message.service");
const normalize_file_name_1 = require("../common/utils/normalize-file-name");
const minio_service_1 = require("../storage/minio.service");
const user_object_name_1 = require("../storage/utils/user-object-name");
const upload_entity_1 = require("../uploads/entities/upload.entity");
const file_state_enum_1 = require("../uploads/enums/file-state.enum");
const upload_status_enum_1 = require("../uploads/enums/upload-status.enum");
const rabbitmq_service_1 = require("./rabbitmq.service");
let UploadWorker = UploadWorker_1 = class UploadWorker {
    uploadsRepository;
    rabbitMqService;
    minioService;
    logger;
    messages;
    jobRetryTimers = new Set();
    retryTimer;
    constructor(uploadsRepository, rabbitMqService, minioService, logger, messages) {
        this.uploadsRepository = uploadsRepository;
        this.rabbitMqService = rabbitMqService;
        this.minioService = minioService;
        this.logger = logger;
        this.messages = messages;
    }
    async onApplicationBootstrap() {
        await this.startConsumer();
    }
    onModuleDestroy() {
        clearTimeout(this.retryTimer);
        this.jobRetryTimers.forEach((timer) => clearTimeout(timer));
        this.jobRetryTimers.clear();
    }
    async startConsumer() {
        try {
            const channel = await this.rabbitMqService.getChannel();
            await channel.prefetch(3);
            await channel.consume(this.rabbitMqService.queueName, (message) => void this.process(message));
            this.logger.info(UploadWorker_1.name, 'Upload worker is ready', {
                queue: this.rabbitMqService.queueName,
                prefetch: 3,
            });
        }
        catch (error) {
            this.logger.failure(UploadWorker_1.name, 'RabbitMQ is unavailable; retrying worker', error, {
                retryAfterMs: 5_000,
            });
            this.retryTimer = setTimeout(() => void this.startConsumer(), 5_000);
        }
    }
    async process(message) {
        if (!message) {
            return;
        }
        const channel = await this.rabbitMqService.getChannel();
        let job;
        let failureMessage = this.messages.translate('upload.processingFailed');
        try {
            job = JSON.parse(message.content.toString());
            const upload = await this.uploadsRepository.findOneBy({
                uploadId: job.uploadId,
            });
            if (!upload) {
                this.logger.warning(UploadWorker_1.name, 'Upload job ignored because its record was not found', {
                    uploadId: job.uploadId,
                });
                channel.ack(message);
                return;
            }
            const startedAt = Date.now();
            this.logger.info(UploadWorker_1.name, 'Upload job processing started', {
                uploadId: upload.uploadId,
                fileId: upload.fileId,
                bucket: upload.bucket,
            });
            upload.status = upload_status_enum_1.UploadStatus.PROCESSING;
            await this.uploadsRepository.save(upload);
            failureMessage = this.messages.translate('common.minioUnavailable');
            const safeName = (0, normalize_file_name_1.normalizeFileName)(upload.originalName);
            upload.objectName = (0, user_object_name_1.userObjectName)(upload.username, 'attachments', upload.fileId, safeName);
            await this.minioService.upload(job.tempPath, upload.objectName, upload.mimeType, upload.bucket, upload.tag);
            failureMessage = this.messages.translate('common.databaseUnavailable');
            upload.fullPath = this.minioService.getFullPath(upload.objectName, upload.bucket);
            upload.status = upload_status_enum_1.UploadStatus.COMPLETED;
            upload.state = file_state_enum_1.FileState.DONE;
            upload.error = undefined;
            await this.uploadsRepository.save(upload);
            await (0, promises_1.unlink)(job.tempPath).catch(() => undefined);
            channel.ack(message);
            this.logger.info(UploadWorker_1.name, 'Upload job completed', {
                uploadId: upload.uploadId,
                fileId: upload.fileId,
                bucket: upload.bucket,
                durationMs: Date.now() - startedAt,
            });
        }
        catch (error) {
            if (!job) {
                await this.markAsFailed(job, error, failureMessage);
                channel.ack(message);
                return;
            }
            await this.retry(job, message, channel, error, failureMessage);
        }
    }
    async retry(job, message, channel, error, reason) {
        const retryAfterMs = 5_000;
        this.logger.failure(UploadWorker_1.name, 'Upload job postponed until infrastructure is available', error, {
            uploadId: job.uploadId,
            reason,
            retryAfterMs,
        });
        await this.uploadsRepository
            .update(job.uploadId, {
            status: upload_status_enum_1.UploadStatus.QUEUED,
            state: file_state_enum_1.FileState.PENDING,
            error: reason,
        })
            .catch((databaseError) => {
            this.logger.warning(UploadWorker_1.name, 'PostgreSQL is unavailable; upload job remains in RabbitMQ', {
                uploadId: job.uploadId,
                error: databaseError instanceof Error ? databaseError.message : String(databaseError),
            });
        });
        const timer = setTimeout(() => {
            this.jobRetryTimers.delete(timer);
            try {
                channel.nack(message, false, true);
            }
            catch {
            }
        }, retryAfterMs);
        this.jobRetryTimers.add(timer);
    }
    async markAsFailed(job, error, message) {
        this.logger.failure(UploadWorker_1.name, 'Upload job failed', error, {
            uploadId: job?.uploadId,
            reason: message,
        });
        if (!job) {
            return;
        }
        await this.uploadsRepository
            .update(job.uploadId, {
            status: upload_status_enum_1.UploadStatus.FAILED,
            state: file_state_enum_1.FileState.FAILURE,
            error: message,
        })
            .catch((databaseError) => {
            this.logger.failure(UploadWorker_1.name, 'Could not update failed upload state in PostgreSQL', databaseError, {
                uploadId: job.uploadId,
            });
        });
        await (0, promises_1.unlink)(job.tempPath).catch(() => undefined);
    }
};
exports.UploadWorker = UploadWorker;
exports.UploadWorker = UploadWorker = UploadWorker_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(upload_entity_1.Upload)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        rabbitmq_service_1.RabbitMqService,
        minio_service_1.MinioService,
        log_manager_service_1.LogManager,
        i18n_message_service_1.I18nMessageService])
], UploadWorker);
//# sourceMappingURL=upload.worker.js.map