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
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackgroundService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const node_crypto_1 = require("node:crypto");
const promises_1 = require("node:fs/promises");
const i18n_message_service_1 = require("../common/i18n/i18n-message.service");
const normalize_file_name_1 = require("../common/utils/normalize-file-name");
const typeorm_2 = require("typeorm");
const minio_service_1 = require("../storage/minio.service");
const user_object_name_1 = require("../storage/utils/user-object-name");
const background_entity_1 = require("./entities/background.entity");
let BackgroundService = class BackgroundService {
    backgroundRepository;
    minioService;
    messages;
    constructor(backgroundRepository, minioService, messages) {
        this.backgroundRepository = backgroundRepository;
        this.minioService = minioService;
        this.messages = messages;
    }
    async get(username) {
        try {
            const background = await this.backgroundRepository.findOneBy({
                username,
            });
            return background ?? this.backgroundRepository.save(this.backgroundRepository.create({ username }));
        }
        catch {
            throw this.databaseError();
        }
    }
    async update(username, dto) {
        const background = await this.get(username);
        background.userMessageBackgroundColor = dto.userMessageBackgroundColor ?? background.userMessageBackgroundColor;
        background.userMessageTextColor = dto.userMessageTextColor ?? background.userMessageTextColor;
        background.enabled = dto.enabled ?? background.enabled;
        background.fit = dto.fit ?? background.fit;
        background.overlay = dto.overlay ?? background.overlay;
        background.blur = dto.blur ?? background.blur;
        background.applyToAll = dto.applyToAll ?? background.applyToAll;
        try {
            return await this.backgroundRepository.save(background);
        }
        catch {
            throw this.databaseError();
        }
    }
    async uploadImage(username, file) {
        const objectName = (0, user_object_name_1.userObjectName)(username, 'backgrounds', (0, node_crypto_1.randomUUID)());
        try {
            await this.minioService.upload(file.path, objectName, file.mimetype);
        }
        catch {
            throw new common_1.ServiceUnavailableException(this.messages.translate('common.minioUnavailable'));
        }
        finally {
            await (0, promises_1.unlink)(file.path).catch(() => undefined);
        }
        let background;
        try {
            background = await this.get(username);
        }
        catch (error) {
            await this.minioService.remove(objectName).catch(() => undefined);
            throw error;
        }
        const previousObject = background.objectName;
        background.objectName = objectName;
        background.fullPath = this.minioService.getFullPath(objectName);
        background.originalName = (0, normalize_file_name_1.normalizeFileName)(file.originalname);
        background.mimeType = file.mimetype;
        try {
            const saved = await this.backgroundRepository.save(background);
            if (previousObject) {
                await this.minioService.remove(previousObject).catch(() => undefined);
            }
            return saved;
        }
        catch {
            await this.minioService.remove(objectName).catch(() => undefined);
            throw this.databaseError();
        }
    }
    async preview(username) {
        const background = await this.get(username);
        if (!background.objectName || !background.mimeType) {
            throw new common_1.ConflictException(this.messages.translate('background.notConfigured'));
        }
        try {
            return {
                background,
                ...(await this.minioService.preview(background.objectName)),
            };
        }
        catch {
            throw new common_1.ServiceUnavailableException(this.messages.translate('common.minioUnavailable'));
        }
    }
    databaseError() {
        return new common_1.ServiceUnavailableException(this.messages.translate('common.databaseUnavailable'));
    }
};
exports.BackgroundService = BackgroundService;
exports.BackgroundService = BackgroundService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(background_entity_1.Background)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        minio_service_1.MinioService,
        i18n_message_service_1.I18nMessageService])
], BackgroundService);
//# sourceMappingURL=background.service.js.map