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
exports.UploadsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const keycloak_auth_guard_1 = require("../auth/guards/keycloak-auth.guard");
const i18n_message_service_1 = require("../common/i18n/i18n-message.service");
const swagger_message_1 = require("../common/i18n/swagger-message");
const upload_config_1 = require("./config/upload.config");
const upload_context_dto_1 = require("./dto/upload-context.dto");
const rename_file_dto_1 = require("./dto/rename-file.dto");
const file_state_enum_1 = require("./enums/file-state.enum");
const uploads_service_1 = require("./uploads.service");
const swagger_1 = require("@nestjs/swagger");
let UploadsController = class UploadsController {
    uploadsService;
    messages;
    constructor(uploadsService, messages) {
        this.uploadsService = uploadsService;
        this.messages = messages;
    }
    async upload(files, dto, request) {
        if (!files?.length) {
            throw new common_1.BadRequestException(this.messages.translate('upload.selectFile'));
        }
        if ((!dto.collectionId && !dto.historyId) || (dto.collectionId && dto.historyId)) {
            throw new common_1.BadRequestException(this.messages.translate('upload.invalidScope'));
        }
        const data = await this.uploadsService.create(files, request.userName, dto.collectionId, dto.historyId);
        return {
            success: true,
            status: common_1.HttpStatus.ACCEPTED,
            message: this.messages.translate('upload.queued'),
            data,
        };
    }
    async getGeneralFiles(request) {
        const files = await this.uploadsService.findAll(request.userName);
        return {
            success: true,
            status: common_1.HttpStatus.OK,
            message: this.messages.translate('upload.generalFilesReceived'),
            data: files,
        };
    }
    async getStatus(fileId, request) {
        const upload = await this.uploadsService.findOne(fileId, request.userName);
        return {
            success: true,
            status: common_1.HttpStatus.OK,
            message: this.messages.translate(upload.state === file_state_enum_1.FileState.FAILURE ? 'upload.failed' : 'upload.statusReceived'),
            data: [upload],
        };
    }
    async rename(fileId, dto, request) {
        const file = await this.uploadsService.rename(fileId, dto.filename, request.userName);
        return {
            success: true,
            status: common_1.HttpStatus.OK,
            message: this.messages.translate('upload.renamed'),
            data: file,
        };
    }
    async remove(fileId, request) {
        await this.uploadsService.remove(fileId, request.userName);
        return {
            success: true,
            status: common_1.HttpStatus.OK,
            message: this.messages.translate('upload.deleted'),
            data: { fileId },
        };
    }
    async preview(fileId, request, response) {
        const { upload, stream, size } = await this.uploadsService.preview(fileId, request.userName);
        response.setHeader('Content-Type', upload.mimeType);
        response.setHeader('Content-Length', size);
        response.setHeader('Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(upload.originalName)}`);
        stream.pipe(response);
    }
    async download(fileId, request, response) {
        const { upload, stream, size } = await this.uploadsService.download(fileId, request.userName);
        response.setHeader('Content-Type', upload.mimeType);
        response.setHeader('Content-Length', size);
        response.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(upload.filename)}`);
        stream.pipe(response);
    }
};
exports.UploadsController = UploadsController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: (0, swagger_message_1.swaggerMessage)('swagger.upload.multiple') }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            required: ['files'],
            oneOf: [{ required: ['files', 'historyId'] }, { required: ['files', 'collectionId'] }],
            properties: {
                files: {
                    type: 'array',
                    items: { type: 'string', format: 'binary' },
                },
                collectionId: {
                    type: 'string',
                    description: (0, swagger_message_1.swaggerMessage)('swagger.upload.projectConversationId'),
                },
                historyId: {
                    type: 'string',
                    description: (0, swagger_message_1.swaggerMessage)('swagger.upload.generalConversationId'),
                },
            },
        },
    }),
    (0, swagger_1.ApiAcceptedResponse)({ description: (0, swagger_message_1.swaggerMessage)('upload.queued') }),
    (0, common_1.HttpCode)(common_1.HttpStatus.ACCEPTED),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('files', 10, upload_config_1.uploadOptions)),
    __param(0, (0, common_1.UploadedFiles)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, upload_context_dto_1.UploadContextDto, Object]),
    __metadata("design:returntype", Promise)
], UploadsController.prototype, "upload", null);
__decorate([
    (0, common_1.Get)('files'),
    (0, swagger_1.ApiOperation)({ summary: (0, swagger_message_1.swaggerMessage)('swagger.upload.generalFiles') }),
    (0, swagger_1.ApiOkResponse)({ description: (0, swagger_message_1.swaggerMessage)('upload.generalFilesReceived') }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UploadsController.prototype, "getGeneralFiles", null);
__decorate([
    (0, common_1.Get)(':fileId'),
    (0, swagger_1.ApiOperation)({ summary: (0, swagger_message_1.swaggerMessage)('swagger.upload.status') }),
    (0, swagger_1.ApiOkResponse)({ description: (0, swagger_message_1.swaggerMessage)('upload.statusReceived') }),
    __param(0, (0, common_1.Param)('fileId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UploadsController.prototype, "getStatus", null);
__decorate([
    (0, common_1.Patch)(':fileId/filename'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: (0, swagger_message_1.swaggerMessage)('swagger.upload.rename') }),
    (0, swagger_1.ApiBody)({ type: rename_file_dto_1.RenameFileDto }),
    (0, swagger_1.ApiOkResponse)({ description: (0, swagger_message_1.swaggerMessage)('upload.renamed') }),
    __param(0, (0, common_1.Param)('fileId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, rename_file_dto_1.RenameFileDto, Object]),
    __metadata("design:returntype", Promise)
], UploadsController.prototype, "rename", null);
__decorate([
    (0, common_1.Delete)(':fileId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: (0, swagger_message_1.swaggerMessage)('swagger.upload.delete') }),
    (0, swagger_1.ApiOkResponse)({ description: (0, swagger_message_1.swaggerMessage)('upload.deleted') }),
    __param(0, (0, common_1.Param)('fileId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UploadsController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)(':fileId/preview'),
    (0, swagger_1.ApiOperation)({ summary: (0, swagger_message_1.swaggerMessage)('swagger.upload.preview') }),
    (0, swagger_1.ApiOkResponse)({
        description: (0, swagger_message_1.swaggerMessage)('swagger.upload.fileContent'),
        content: {
            'application/octet-stream': {
                schema: { type: 'string', format: 'binary' },
            },
        },
    }),
    __param(0, (0, common_1.Param)('fileId')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], UploadsController.prototype, "preview", null);
__decorate([
    (0, common_1.Get)(':fileId/download'),
    (0, swagger_1.ApiOperation)({ summary: (0, swagger_message_1.swaggerMessage)('swagger.upload.download') }),
    (0, swagger_1.ApiProduces)('application/octet-stream'),
    (0, swagger_1.ApiOkResponse)({ description: (0, swagger_message_1.swaggerMessage)('upload.downloaded') }),
    __param(0, (0, common_1.Param)('fileId')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], UploadsController.prototype, "download", null);
exports.UploadsController = UploadsController = __decorate([
    (0, swagger_1.ApiTags)('Uploads'),
    (0, swagger_1.ApiBearerAuth)('bearerAuth'),
    (0, common_1.UseGuards)(keycloak_auth_guard_1.KeycloakAuthGuard),
    (0, common_1.Controller)('uploads'),
    __metadata("design:paramtypes", [uploads_service_1.UploadsService,
        i18n_message_service_1.I18nMessageService])
], UploadsController);
//# sourceMappingURL=uploads.controller.js.map