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
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileManagerService = void 0;
const axios_1 = require("@nestjs/axios");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const node_crypto_1 = require("node:crypto");
const promises_1 = require("node:fs/promises");
const node_path_1 = require("node:path");
const node_stream_1 = require("node:stream");
const rxjs_1 = require("rxjs");
const i18n_message_service_1 = require("../common/i18n/i18n-message.service");
const external_http_exception_1 = require("../common/http/external-http-exception");
const projects_service_1 = require("../projects/projects.service");
const uploads_service_1 = require("../uploads/uploads.service");
let FileManagerService = class FileManagerService {
    httpService;
    configService;
    projectsService;
    uploadsService;
    messages;
    constructor(httpService, configService, projectsService, uploadsService, messages) {
        this.httpService = httpService;
        this.configService = configService;
        this.projectsService = projectsService;
        this.uploadsService = uploadsService;
        this.messages = messages;
    }
    async getRecent(query, token) {
        const folderPath = query.folderId ? `${encodeURIComponent(query.folderId)}/` : '';
        const url = `${this.baseUrl()}/files-folders/list/${folderPath}contents`;
        const response = await this.request(() => (0, rxjs_1.firstValueFrom)(this.httpService.get(url, {
            headers: this.authorization(token),
            params: { page: query.page, limit: query.limit },
        })));
        return response.data.data;
    }
    async getStorage(token) {
        const url = `${this.baseUrl()}/users/storage`;
        const response = await this.request(() => (0, rxjs_1.firstValueFrom)(this.httpService.get(url, {
            headers: this.authorization(token),
        })));
        return response.data.data;
    }
    async upload(files, folderId, token) {
        const url = `${this.baseUrl()}/files`;
        const form = new FormData();
        form.append('folderId', folderId);
        form.append('location', this.location());
        try {
            for (const file of files) {
                form.append('files', new Blob([await (0, promises_1.readFile)(file.path)], { type: file.mimetype }), file.originalname);
            }
            const response = await this.request(() => (0, rxjs_1.firstValueFrom)(this.httpService.post(url, form, {
                headers: this.authorization(token),
                maxBodyLength: this.maxFileSize() * files.length,
                maxContentLength: this.maxFileSize() * files.length,
            })));
            return response.data.data;
        }
        finally {
            await this.removeTempFiles(files);
        }
    }
    async import(fileIds, collectionId, username, token) {
        await this.projectsService.findOwnedCollection(collectionId, username);
        const files = [];
        try {
            for (const fileId of fileIds) {
                files.push(await this.download(fileId, token));
            }
            return await this.uploadsService.create(files, username, collectionId);
        }
        catch (error) {
            await this.removeTempFiles(files);
            throw error;
        }
    }
    async download(fileId, token) {
        const url = `${this.baseUrl()}/files/download`;
        const response = await this.request(() => (0, rxjs_1.firstValueFrom)(this.httpService.post(url, { fileIds: [fileId] }, {
            headers: this.authorization(token),
            responseType: 'arraybuffer',
            maxContentLength: this.maxFileSize(),
        })));
        const buffer = Buffer.from(response.data);
        const originalname = this.responseFileName(response.headers['content-disposition'], fileId);
        const directory = this.tempDirectory();
        const path = (0, node_path_1.join)(directory, (0, node_crypto_1.randomUUID)());
        await (0, promises_1.mkdir)(directory, { recursive: true });
        await (0, promises_1.writeFile)(path, buffer);
        return {
            fieldname: 'files',
            originalname,
            encoding: '7bit',
            mimetype: String(response.headers['content-type'] ?? 'application/octet-stream'),
            size: buffer.length,
            destination: directory,
            filename: (0, node_path_1.basename)(path),
            path,
            buffer,
            stream: node_stream_1.Readable.from(buffer),
        };
    }
    async request(callback) {
        try {
            return await callback();
        }
        catch (error) {
            throw (await (0, external_http_exception_1.externalHttpException)(error)) ?? new common_1.BadGatewayException(this.messages.translate('fileManager.unavailable'));
        }
    }
    baseUrl() {
        const url = this.configService.get('DM_BASE_ASISSTANT_LANGUAGE_URL');
        if (!url) {
            throw new common_1.ServiceUnavailableException(this.messages.translate('fileManager.notConfigured'));
        }
        return url.replace(/\/$/, '');
    }
    location() {
        return this.configService.get('DM_LOCATION_ASISSTANT_LANGUAGE', 'assistant-language');
    }
    maxFileSize() {
        return this.configService.get('UPLOAD_MAX_FILE_SIZE', 100 * 1024 * 1024);
    }
    tempDirectory() {
        return this.configService.get('UPLOAD_TEMP_DIR', '/tmp/dana-uploads');
    }
    authorization(token) {
        return { Authorization: `Bearer ${token}` };
    }
    responseFileName(disposition, fallback) {
        if (typeof disposition !== 'string') {
            return fallback;
        }
        const encoded = /filename\*=UTF-8''([^;]+)/i.exec(disposition)?.[1];
        const plain = /filename="?([^";]+)"?/i.exec(disposition)?.[1];
        try {
            return decodeURIComponent(encoded ?? plain ?? fallback);
        }
        catch {
            return encoded ?? plain ?? fallback;
        }
    }
    async removeTempFiles(files) {
        await Promise.all(files.map((file) => (0, promises_1.unlink)(file.path).catch(() => undefined)));
    }
};
exports.FileManagerService = FileManagerService;
exports.FileManagerService = FileManagerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService,
        config_1.ConfigService,
        projects_service_1.ProjectsService,
        uploads_service_1.UploadsService,
        i18n_message_service_1.I18nMessageService])
], FileManagerService);
//# sourceMappingURL=file-manager.service.js.map