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
exports.BackgroundController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const promises_1 = require("node:fs/promises");
const keycloak_auth_guard_1 = require("../auth/guards/keycloak-auth.guard");
const i18n_message_service_1 = require("../common/i18n/i18n-message.service");
const swagger_message_1 = require("../common/i18n/swagger-message");
const upload_config_1 = require("../uploads/config/upload.config");
const background_service_1 = require("./background.service");
const update_background_dto_1 = require("./dto/update-background.dto");
let BackgroundController = class BackgroundController {
    backgroundService;
    messages;
    constructor(backgroundService, messages) {
        this.backgroundService = backgroundService;
        this.messages = messages;
    }
    async get(request) {
        const background = await this.backgroundService.get(request.userName);
        return {
            success: true,
            status: common_1.HttpStatus.OK,
            message: this.messages.translate('background.received'),
            data: background,
        };
    }
    async update(dto, request) {
        const background = await this.backgroundService.update(request.userName, dto);
        return {
            success: true,
            status: common_1.HttpStatus.OK,
            message: this.messages.translate('background.updated'),
            data: background,
        };
    }
    async uploadImage(file, request) {
        if (!file) {
            throw new common_1.BadRequestException(this.messages.translate('background.selectImage'));
        }
        if (!file.mimetype.startsWith('image/')) {
            await (0, promises_1.unlink)(file.path).catch(() => undefined);
            throw new common_1.BadRequestException(this.messages.translate('background.invalidImage'));
        }
        const background = await this.backgroundService.uploadImage(request.userName, file);
        return {
            success: true,
            status: common_1.HttpStatus.OK,
            message: this.messages.translate('background.saved'),
            data: background,
        };
    }
    async preview(request, response) {
        const { background, stream, size } = await this.backgroundService.preview(request.userName);
        response.setHeader('Content-Type', background.mimeType);
        response.setHeader('Content-Length', size);
        stream.pipe(response);
    }
};
exports.BackgroundController = BackgroundController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: (0, swagger_message_1.swaggerMessage)('swagger.background.get') }),
    (0, swagger_1.ApiOkResponse)({ description: (0, swagger_message_1.swaggerMessage)('background.received') }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BackgroundController.prototype, "get", null);
__decorate([
    (0, common_1.Patch)(),
    (0, swagger_1.ApiOperation)({ summary: (0, swagger_message_1.swaggerMessage)('swagger.background.update') }),
    (0, swagger_1.ApiBody)({ type: update_background_dto_1.UpdateBackgroundDto }),
    (0, swagger_1.ApiOkResponse)({ description: (0, swagger_message_1.swaggerMessage)('background.updated') }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [update_background_dto_1.UpdateBackgroundDto, Object]),
    __metadata("design:returntype", Promise)
], BackgroundController.prototype, "update", null);
__decorate([
    (0, common_1.Post)('image'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: (0, swagger_message_1.swaggerMessage)('swagger.background.upload') }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            required: ['image'],
            properties: {
                image: { type: 'string', format: 'binary' },
            },
        },
    }),
    (0, swagger_1.ApiOkResponse)({ description: (0, swagger_message_1.swaggerMessage)('background.saved') }),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('image', upload_config_1.uploadOptions)),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], BackgroundController.prototype, "uploadImage", null);
__decorate([
    (0, common_1.Get)('image'),
    (0, swagger_1.ApiOperation)({ summary: (0, swagger_message_1.swaggerMessage)('swagger.background.preview') }),
    (0, swagger_1.ApiOkResponse)({
        description: (0, swagger_message_1.swaggerMessage)('swagger.background.image'),
        content: {
            'image/*': { schema: { type: 'string', format: 'binary' } },
        },
    }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], BackgroundController.prototype, "preview", null);
exports.BackgroundController = BackgroundController = __decorate([
    (0, swagger_1.ApiTags)('Background'),
    (0, swagger_1.ApiBearerAuth)('bearerAuth'),
    (0, common_1.UseGuards)(keycloak_auth_guard_1.KeycloakAuthGuard),
    (0, common_1.Controller)('background'),
    __metadata("design:paramtypes", [background_service_1.BackgroundService,
        i18n_message_service_1.I18nMessageService])
], BackgroundController);
//# sourceMappingURL=background.controller.js.map