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
exports.FileManagerController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const keycloak_auth_guard_1 = require("../auth/guards/keycloak-auth.guard");
const i18n_message_service_1 = require("../common/i18n/i18n-message.service");
const swagger_message_1 = require("../common/i18n/swagger-message");
const upload_config_1 = require("../uploads/config/upload.config");
const file_manager_list_query_dto_1 = require("./dto/file-manager-list-query.dto");
const import_files_dto_1 = require("./dto/import-files.dto");
const upload_file_manager_files_dto_1 = require("./dto/upload-file-manager-files.dto");
const file_manager_service_1 = require("./file-manager.service");
let FileManagerController = class FileManagerController {
    fileManagerService;
    messages;
    constructor(fileManagerService, messages) {
        this.fileManagerService = fileManagerService;
        this.messages = messages;
    }
    async getRecent(query, request) {
        return this.response(common_1.HttpStatus.OK, 'fileManager.filesReceived', await this.fileManagerService.getRecent(query, request.token));
    }
    async getStorage(request) {
        return this.response(common_1.HttpStatus.OK, 'fileManager.storageReceived', await this.fileManagerService.getStorage(request.token));
    }
    async upload(files, dto, request) {
        if (!files?.length) {
            throw new common_1.BadRequestException(this.messages.translate('upload.selectFile'));
        }
        return this.response(common_1.HttpStatus.CREATED, 'fileManager.filesUploaded', await this.fileManagerService.upload(files, dto.folderId, request.token));
    }
    async import(collectionId, dto, request) {
        return this.response(common_1.HttpStatus.CREATED, 'fileManager.filesQueued', await this.fileManagerService.import(dto.fileIds, collectionId, request.userName, request.token));
    }
    response(status, messageKey, data) {
        return {
            success: true,
            status,
            message: this.messages.translate(messageKey),
            data,
        };
    }
};
exports.FileManagerController = FileManagerController;
__decorate([
    (0, common_1.Get)('recent'),
    (0, swagger_1.ApiOperation)({ summary: (0, swagger_message_1.swaggerMessage)('swagger.fileManager.recent') }),
    (0, swagger_1.ApiOkResponse)({ description: (0, swagger_message_1.swaggerMessage)('fileManager.filesReceived') }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [file_manager_list_query_dto_1.FileManagerListQueryDto, Object]),
    __metadata("design:returntype", Promise)
], FileManagerController.prototype, "getRecent", null);
__decorate([
    (0, common_1.Post)('storage'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: (0, swagger_message_1.swaggerMessage)('swagger.fileManager.storage') }),
    (0, swagger_1.ApiOkResponse)({ description: (0, swagger_message_1.swaggerMessage)('fileManager.storageReceived') }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FileManagerController.prototype, "getStorage", null);
__decorate([
    (0, common_1.Post)('files'),
    (0, swagger_1.ApiOperation)({ summary: (0, swagger_message_1.swaggerMessage)('swagger.fileManager.upload') }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            required: ['files', 'folderId'],
            properties: {
                files: { type: 'array', items: { type: 'string', format: 'binary' } },
                folderId: { type: 'string' },
            },
        },
    }),
    (0, swagger_1.ApiCreatedResponse)({ description: (0, swagger_message_1.swaggerMessage)('fileManager.filesUploaded') }),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('files', 10, upload_config_1.uploadOptions)),
    __param(0, (0, common_1.UploadedFiles)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, upload_file_manager_files_dto_1.UploadFileManagerFilesDto, Object]),
    __metadata("design:returntype", Promise)
], FileManagerController.prototype, "upload", null);
__decorate([
    (0, common_1.Post)('files/download/:collectionId'),
    (0, swagger_1.ApiOperation)({ summary: (0, swagger_message_1.swaggerMessage)('swagger.fileManager.import') }),
    (0, swagger_1.ApiBody)({ type: import_files_dto_1.ImportFilesDto }),
    (0, swagger_1.ApiCreatedResponse)({ description: (0, swagger_message_1.swaggerMessage)('fileManager.filesQueued') }),
    __param(0, (0, common_1.Param)('collectionId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, import_files_dto_1.ImportFilesDto, Object]),
    __metadata("design:returntype", Promise)
], FileManagerController.prototype, "import", null);
exports.FileManagerController = FileManagerController = __decorate([
    (0, swagger_1.ApiTags)('File Manager'),
    (0, swagger_1.ApiBearerAuth)('bearerAuth'),
    (0, common_1.UseGuards)(keycloak_auth_guard_1.KeycloakAuthGuard),
    (0, common_1.Controller)('fileManager'),
    __metadata("design:paramtypes", [file_manager_service_1.FileManagerService,
        i18n_message_service_1.I18nMessageService])
], FileManagerController);
//# sourceMappingURL=file-manager.controller.js.map