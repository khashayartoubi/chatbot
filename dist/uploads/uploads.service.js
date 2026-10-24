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
var UploadsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const promises_1 = require("node:fs/promises");
const node_crypto_1 = require("node:crypto");
const typeorm_2 = require("typeorm");
const i18n_message_service_1 = require("../common/i18n/i18n-message.service");
const log_manager_service_1 = require("../common/logger/log-manager.service");
const project_entity_1 = require("../projects/entities/project.entity");
const normalize_file_name_1 = require("../common/utils/normalize-file-name");
const upload_entity_1 = require("./entities/upload.entity");
const upload_status_enum_1 = require("./enums/upload-status.enum");
const file_state_enum_1 = require("./enums/file-state.enum");
const file_tag_enum_1 = require("../storage/enums/file-tag.enum");
const rabbitmq_service_1 = require("../queue/rabbitmq.service");
const minio_service_1 = require("../storage/minio.service");
const user_object_name_1 = require("../storage/utils/user-object-name");
const infrastructure_unavailable_exception_1 = require("../error/exceptions/infrastructure-unavailable.exception");
let UploadsService = UploadsService_1 = class UploadsService {
    uploadsRepository;
    projectsRepository;
    rabbitMqService;
    minioService;
    logger;
    messages;
    configService;
    streamBucket;
    constructor(uploadsRepository, projectsRepository, rabbitMqService, minioService, logger, messages, configService) {
        this.uploadsRepository = uploadsRepository;
        this.projectsRepository = projectsRepository;
        this.rabbitMqService = rabbitMqService;
        this.minioService = minioService;
        this.logger = logger;
        this.messages = messages;
        this.configService = configService;
        this.streamBucket = this.configService.get('MINIO_BUCKET', 'dana-client');
    }
    async create(files, username, collectionId, historyId) {
        this.logger.info(UploadsService_1.name, 'Queued upload request started', {
            username,
            fileCount: files.length,
            scope: collectionId ? 'project' : 'general',
            collectionId,
            historyId,
        });
        let projectId;
        try {
            projectId = await this.resolveProjectId(collectionId, username);
        }
        catch (error) {
            await this.removeFiles(files);
            throw error;
        }
        let uploads;
        try {
            uploads = await this.uploadsRepository.save(files.map((file) => {
                const filename = (0, normalize_file_name_1.normalizeFileName)(file.originalname);
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
                    tag: file_tag_enum_1.FileTag.USER,
                });
            }));
        }
        catch {
            await this.removeFiles(files);
            throw new common_1.ServiceUnavailableException(this.messages.translate('common.databaseUnavailable'));
        }
        try {
            await Promise.all(uploads.map((upload, index) => {
                const file = files[index];
                if (!file) {
                    throw new Error(this.messages.translate('upload.tempFileMissing'));
                }
                return this.rabbitMqService.publish({
                    uploadId: upload.uploadId,
                    tempPath: file.path,
                });
            }));
        }
        catch (error) {
            await Promise.all(uploads.map(async (upload) => {
                upload.status = upload_status_enum_1.UploadStatus.FAILED;
                upload.state = file_state_enum_1.FileState.FAILURE;
                upload.error = this.messages.translate('upload.queueUnavailable');
                await this.uploadsRepository.save(upload).catch(() => undefined);
            }));
            await this.removeFiles(files);
            if (error instanceof infrastructure_unavailable_exception_1.InfrastructureUnavailableException) {
                throw error;
            }
            throw new common_1.ServiceUnavailableException(this.messages.translate('upload.queueUnavailable'));
        }
        this.logger.info(UploadsService_1.name, 'Upload jobs queued', {
            username,
            fileCount: uploads.length,
            scope: projectId ? 'project' : 'general',
        });
        return uploads.map((upload) => this.toFile(upload));
    }
    async discardTemporaryFiles(files) {
        await this.removeFiles(files);
    }
    async createForStream(files, username, historyId, projectId) {
        if (!files.length) {
            return [];
        }
        this.logger.info(UploadsService_1.name, 'Stream file upload started', {
            username,
            historyId,
            fileCount: files.length,
            scope: projectId ? 'project' : 'general',
            bucket: this.streamBucket,
        });
        let uploads;
        try {
            uploads = await this.uploadsRepository.save(files.map((file) => {
                const filename = (0, normalize_file_name_1.normalizeFileName)(file.originalname);
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
                    tag: file_tag_enum_1.FileTag.USER,
                    status: upload_status_enum_1.UploadStatus.PROCESSING,
                });
            }));
        }
        catch {
            await this.removeFiles(files);
            throw new common_1.ServiceUnavailableException(this.messages.translate('common.databaseUnavailable'));
        }
        let failureMessage = this.messages.translate('common.minioUnavailable');
        try {
            const results = await Promise.allSettled(uploads.map(async (upload, index) => {
                const file = files[index];
                if (!file) {
                    throw new Error(this.messages.translate('upload.tempFileMissing'));
                }
                const safeName = (0, normalize_file_name_1.normalizeFileName)(upload.originalName);
                upload.objectName = (0, user_object_name_1.userObjectName)(upload.username, 'attachments', upload.fileId, safeName);
                await this.minioService.upload(file.path, upload.objectName, upload.mimeType, upload.bucket, upload.tag);
                upload.fullPath = this.minioService.getFullPath(upload.objectName, upload.bucket);
                upload.status = upload_status_enum_1.UploadStatus.COMPLETED;
                upload.state = file_state_enum_1.FileState.DONE;
            }));
            const failedUpload = results.find((result) => result.status === 'rejected');
            if (failedUpload?.status === 'rejected') {
                throw failedUpload.reason;
            }
            failureMessage = this.messages.translate('common.databaseUnavailable');
            const savedUploads = await this.uploadsRepository.save(uploads);
            this.logger.info(UploadsService_1.name, 'Stream file upload completed', {
                username,
                historyId,
                fileCount: savedUploads.length,
                bucket: this.streamBucket,
            });
            return savedUploads;
        }
        catch (error) {
            this.logger.failure(UploadsService_1.name, 'Stream file upload failed', error, {
                username,
                historyId,
                fileCount: uploads.length,
                reason: failureMessage,
            });
            await Promise.all(uploads.filter((upload) => upload.objectName).map((upload) => this.minioService.remove(upload.objectName, upload.bucket).catch(() => undefined)));
            await this.uploadsRepository.delete({ uploadId: (0, typeorm_2.In)(uploads.map((upload) => upload.uploadId)) }).catch(() => undefined);
            throw new common_1.ServiceUnavailableException(failureMessage);
        }
        finally {
            await this.removeFiles(files);
        }
    }
    async findAll(username, collectionId) {
        const projectId = await this.resolveProjectId(collectionId, username);
        try {
            const uploads = await this.uploadsRepository.find({
                where: {
                    username,
                    projectId: projectId ?? (0, typeorm_2.IsNull)(),
                },
                order: { createdAt: 'DESC' },
            });
            return uploads.map((upload) => this.toFile(upload));
        }
        catch {
            throw new common_1.ServiceUnavailableException(this.messages.translate('common.databaseUnavailable'));
        }
    }
    async registerAiFile(dto) {
        this.logger.info(UploadsService_1.name, 'AI file registration started', {
            username: dto.username,
            fileId: dto.fileId,
            sourceFileId: dto.sourceFileId,
            bucket: dto.bucket,
        });
        let existingFile;
        let sourceFile;
        try {
            [existingFile, sourceFile] = await Promise.all([
                this.uploadsRepository.findOneBy({
                    fileId: dto.fileId,
                    username: dto.username,
                }),
                this.uploadsRepository.findOneBy({
                    fileId: dto.sourceFileId,
                    username: dto.username,
                    tag: file_tag_enum_1.FileTag.USER,
                }),
            ]);
        }
        catch {
            throw new common_1.ServiceUnavailableException(this.messages.translate('common.databaseUnavailable'));
        }
        if (existingFile) {
            throw new common_1.ConflictException(this.messages.translate('upload.aiDuplicate'));
        }
        if (!sourceFile) {
            throw new common_1.NotFoundException(this.messages.translate('upload.sourceNotFound'));
        }
        if (sourceFile.objectName === dto.objectName && sourceFile.bucket === dto.bucket) {
            throw new common_1.ConflictException(this.messages.translate('upload.aiMustBeNew'));
        }
        let stat;
        try {
            stat = await this.minioService.stat(dto.objectName, dto.bucket);
            const minioTag = await this.minioService.getTag(dto.objectName, dto.bucket);
            if (minioTag !== file_tag_enum_1.FileTag.AI) {
                throw new common_1.ConflictException(this.messages.translate('upload.invalidAiTag'));
            }
        }
        catch (error) {
            if (error instanceof common_1.ConflictException) {
                throw error;
            }
            throw new common_1.ServiceUnavailableException(this.messages.translate('upload.aiObjectNotFound'));
        }
        const upload = this.uploadsRepository.create({
            username: dto.username,
            fileId: dto.fileId,
            sourceFileId: sourceFile.fileId,
            projectId: sourceFile.projectId,
            historyId: sourceFile.historyId,
            sessionId: sourceFile.sessionId,
            filename: (0, normalize_file_name_1.normalizeFileName)(dto.filename),
            originalName: (0, normalize_file_name_1.normalizeFileName)(dto.originalName ?? dto.filename),
            mimeType: dto.mimeType ?? this.getMetadataString(stat.metaData, 'content-type') ?? 'application/octet-stream',
            size: dto.size ?? stat.size,
            bucket: dto.bucket,
            objectName: dto.objectName,
            fullPath: this.minioService.getFullPath(dto.objectName, dto.bucket),
            tag: file_tag_enum_1.FileTag.AI,
            status: upload_status_enum_1.UploadStatus.COMPLETED,
            state: file_state_enum_1.FileState.DONE,
            uploadedAt: new Date(),
        });
        try {
            const savedUpload = await this.uploadsRepository.save(upload);
            this.logger.info(UploadsService_1.name, 'AI file registered', {
                username: dto.username,
                fileId: dto.fileId,
                sourceFileId: dto.sourceFileId,
                bucket: dto.bucket,
            });
            return savedUpload;
        }
        catch {
            throw new common_1.ServiceUnavailableException(this.messages.translate('common.databaseUnavailable'));
        }
    }
    async registerGeneratedAiFile(username, objectName, bucket, historyId, projectId) {
        const normalizedObjectName = objectName.trim();
        const normalizedBucket = bucket.trim();
        if (!normalizedBucket || !normalizedObjectName.startsWith(`${(0, user_object_name_1.userObjectName)(username)}/`)) {
            throw new common_1.BadRequestException(this.messages.translate('upload.aiObjectNotFound'));
        }
        let stat;
        try {
            stat = await this.minioService.stat(normalizedObjectName, normalizedBucket);
        }
        catch {
            throw new common_1.ServiceUnavailableException(this.messages.translate('upload.aiObjectNotFound'));
        }
        const filename = (0, normalize_file_name_1.normalizeFileName)(normalizedObjectName.split('/').at(-1) || 'generated-file');
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
            tag: file_tag_enum_1.FileTag.AI,
            status: upload_status_enum_1.UploadStatus.COMPLETED,
            state: file_state_enum_1.FileState.DONE,
            uploadedAt: new Date(),
        });
        try {
            return await this.uploadsRepository.save(upload);
        }
        catch {
            throw new common_1.ServiceUnavailableException(this.messages.translate('common.databaseUnavailable'));
        }
    }
    async findOne(fileId, username) {
        const upload = await this.findOwnedFile(fileId, username);
        return this.toFile(upload);
    }
    async rename(fileId, filename, username) {
        const upload = await this.findOwnedFile(fileId, username);
        upload.filename = (0, normalize_file_name_1.normalizeFileName)(filename);
        try {
            return this.toFile(await this.uploadsRepository.save(upload));
        }
        catch {
            throw new common_1.ServiceUnavailableException(this.messages.translate('common.databaseUnavailable'));
        }
    }
    async remove(fileId, username) {
        const upload = await this.findOwnedFile(fileId, username);
        if (upload.status === upload_status_enum_1.UploadStatus.QUEUED || upload.status === upload_status_enum_1.UploadStatus.PROCESSING) {
            throw new common_1.ConflictException(this.messages.translate('upload.deleteInProgress'));
        }
        if (upload.objectName) {
            try {
                await this.minioService.remove(upload.objectName, upload.bucket);
            }
            catch {
                throw new common_1.ServiceUnavailableException(this.messages.translate('common.minioUnavailable'));
            }
        }
        try {
            await this.uploadsRepository.delete(upload.uploadId);
        }
        catch {
            throw new common_1.ServiceUnavailableException(this.messages.translate('common.databaseUnavailable'));
        }
    }
    async preview(fileId, username) {
        const upload = await this.findOwnedFile(fileId, username);
        if (upload.state !== file_state_enum_1.FileState.DONE || !upload.objectName) {
            throw new common_1.ConflictException(this.messages.translate('upload.previewNotReady'));
        }
        try {
            const object = await this.minioService.preview(upload.objectName, upload.bucket);
            return { upload, ...object };
        }
        catch {
            throw new common_1.ServiceUnavailableException(this.messages.translate('common.minioUnavailable'));
        }
    }
    async download(fileId, username) {
        try {
            return await this.preview(fileId, username);
        }
        catch (error) {
            if (!(error instanceof common_1.NotFoundException)) {
                throw error;
            }
        }
        let storedObject;
        try {
            storedObject = await this.minioService.findUserObject(fileId, username);
        }
        catch {
            throw new common_1.ServiceUnavailableException(this.messages.translate('common.minioUnavailable'));
        }
        if (!storedObject) {
            throw new common_1.NotFoundException(this.messages.translate('upload.notFound'));
        }
        const filename = storedObject.objectName.split('/').at(-1) ?? fileId;
        const upload = Object.assign(new upload_entity_1.Upload(), {
            fileId,
            username,
            filename,
            originalName: filename,
            mimeType: storedObject.mimeType,
            size: storedObject.size,
            bucket: storedObject.bucket,
            objectName: storedObject.objectName,
            fullPath: this.minioService.getFullPath(storedObject.objectName, storedObject.bucket),
            status: upload_status_enum_1.UploadStatus.COMPLETED,
            state: file_state_enum_1.FileState.DONE,
        });
        const object = await this.minioService.preview(storedObject.objectName, storedObject.bucket);
        return { upload, ...object };
    }
    async findAttachments(uploadIds, username, projectId, conversationId) {
        if (!uploadIds.length) {
            return [];
        }
        let uploads;
        try {
            const baseWhere = {
                fileId: (0, typeorm_2.In)(uploadIds),
                username,
                projectId: projectId ?? (0, typeorm_2.IsNull)(),
                status: upload_status_enum_1.UploadStatus.COMPLETED,
            };
            const where = !conversationId
                ? baseWhere
                : projectId
                    ? [
                        { ...baseWhere, sessionId: conversationId },
                        { ...baseWhere, sessionId: (0, typeorm_2.IsNull)() },
                    ]
                    : [
                        { ...baseWhere, historyId: conversationId },
                        { ...baseWhere, historyId: (0, typeorm_2.IsNull)() },
                    ];
            uploads = await this.uploadsRepository.find({ where });
        }
        catch {
            throw new common_1.ServiceUnavailableException(this.messages.translate('common.databaseUnavailable'));
        }
        if (uploads.length !== new Set(uploadIds).size) {
            throw new common_1.NotFoundException(this.messages.translate('upload.attachmentsNotFound'));
        }
        if (conversationId) {
            try {
                await this.uploadsRepository.update({ fileId: (0, typeorm_2.In)(uploadIds), username }, projectId ? { sessionId: conversationId } : { historyId: conversationId });
                uploads.forEach((upload) => {
                    if (projectId) {
                        upload.sessionId = conversationId;
                    }
                    else {
                        upload.historyId = conversationId;
                    }
                });
            }
            catch {
                throw new common_1.ServiceUnavailableException(this.messages.translate('common.databaseUnavailable'));
            }
        }
        return uploads;
    }
    async findHistoryFiles(username, historyId, projectId) {
        try {
            const uploads = await this.uploadsRepository.find({
                where: {
                    username,
                    projectId: projectId ?? (0, typeorm_2.IsNull)(),
                    ...(projectId ? { sessionId: historyId } : { historyId }),
                },
                order: { createdAt: 'DESC' },
            });
            return uploads.map((upload) => this.toFile(upload));
        }
        catch {
            throw new common_1.ServiceUnavailableException(this.messages.translate('common.databaseUnavailable'));
        }
    }
    async removeByProject(projectId) {
        let uploads;
        try {
            uploads = await this.uploadsRepository.findBy({ projectId });
        }
        catch {
            throw new common_1.ServiceUnavailableException(this.messages.translate('common.databaseUnavailable'));
        }
        try {
            await Promise.all(uploads.filter((upload) => upload.objectName).map((upload) => this.minioService.remove(upload.objectName, upload.bucket)));
        }
        catch {
            throw new common_1.ServiceUnavailableException(this.messages.translate('common.minioUnavailable'));
        }
        try {
            await this.uploadsRepository.delete({ projectId });
        }
        catch {
            throw new common_1.ServiceUnavailableException(this.messages.translate('common.databaseUnavailable'));
        }
    }
    async removeByHistory(username, historyId, projectId) {
        let uploads;
        try {
            uploads = await this.uploadsRepository.find({
                where: {
                    username,
                    projectId: projectId ?? (0, typeorm_2.IsNull)(),
                    ...(projectId ? { sessionId: historyId } : { historyId }),
                },
            });
        }
        catch {
            throw new common_1.ServiceUnavailableException(this.messages.translate('common.databaseUnavailable'));
        }
        try {
            await Promise.all(uploads.filter((upload) => upload.objectName).map((upload) => this.minioService.remove(upload.objectName, upload.bucket)));
        }
        catch {
            throw new common_1.ServiceUnavailableException(this.messages.translate('common.minioUnavailable'));
        }
        try {
            await this.uploadsRepository.remove(uploads);
        }
        catch {
            throw new common_1.ServiceUnavailableException(this.messages.translate('common.databaseUnavailable'));
        }
    }
    async removeFiles(files) {
        await Promise.all(files.map((file) => (0, promises_1.unlink)(file.path).catch(() => undefined)));
    }
    createFileId() {
        return (0, node_crypto_1.randomInt)(10_000_000_000_000, 99_999_999_999_999).toString();
    }
    getMetadataString(metadata, key) {
        if (typeof metadata !== 'object' || metadata === null || Array.isArray(metadata)) {
            return undefined;
        }
        const value = metadata[key];
        return typeof value === 'string' ? value : undefined;
    }
    async findOwnedFile(fileId, username) {
        let upload;
        try {
            upload = await this.uploadsRepository.findOneBy({ fileId, username });
        }
        catch {
            throw new common_1.ServiceUnavailableException(this.messages.translate('common.databaseUnavailable'));
        }
        if (!upload) {
            throw new common_1.NotFoundException(this.messages.translate('upload.notFound'));
        }
        return upload;
    }
    toFile(upload) {
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
    async resolveProjectId(collectionId, username) {
        if (!collectionId) {
            return undefined;
        }
        let project;
        try {
            project = await this.projectsRepository.findOneBy({
                collectionId,
                username,
            });
        }
        catch {
            throw new common_1.ServiceUnavailableException(this.messages.translate('common.databaseUnavailable'));
        }
        if (!project) {
            throw new common_1.NotFoundException(this.messages.translate('project.notFound'));
        }
        return project.id;
    }
};
exports.UploadsService = UploadsService;
exports.UploadsService = UploadsService = UploadsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(upload_entity_1.Upload)),
    __param(1, (0, typeorm_1.InjectRepository)(project_entity_1.Project)),
    __param(3, (0, common_1.Inject)(minio_service_1.MinioService)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        rabbitmq_service_1.RabbitMqService, Object, log_manager_service_1.LogManager,
        i18n_message_service_1.I18nMessageService,
        config_1.ConfigService])
], UploadsService);
//# sourceMappingURL=uploads.service.js.map