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
var AllExceptionsFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AllExceptionsFilter = void 0;
const common_1 = require("@nestjs/common");
const multer_1 = require("multer");
const typeorm_1 = require("typeorm");
const log_manager_service_1 = require("../../common/logger/log-manager.service");
let AllExceptionsFilter = AllExceptionsFilter_1 = class AllExceptionsFilter {
    logger;
    constructor(logger) {
        this.logger = logger;
    }
    catch(exception, host) {
        const http = host.switchToHttp();
        const request = http.getRequest();
        const response = http.getResponse();
        const isHttpError = exception instanceof common_1.HttpException;
        const status = this.getStatus(exception);
        const exceptionResponse = isHttpError ? exception.getResponse() : undefined;
        const body = this.normalizeBody(exceptionResponse);
        const rawMessage = body.message ?? body.error ?? this.getMessage(exception);
        const message = Array.isArray(rawMessage) ? rawMessage.join(', ') : rawMessage;
        this.log(exception, request, status, message);
        if (response.headersSent) {
            return;
        }
        response.status(status).json({
            success: false,
            status,
            message,
            data: [],
        });
    }
    getStatus(exception) {
        if (exception instanceof common_1.HttpException) {
            return exception.getStatus();
        }
        if (exception instanceof typeorm_1.QueryFailedError) {
            return common_1.HttpStatus.SERVICE_UNAVAILABLE;
        }
        if (exception instanceof multer_1.MulterError) {
            return exception.code === 'LIMIT_FILE_SIZE' ? common_1.HttpStatus.PAYLOAD_TOO_LARGE : common_1.HttpStatus.BAD_REQUEST;
        }
        return common_1.HttpStatus.INTERNAL_SERVER_ERROR;
    }
    log(exception, request, status, message) {
        const metadata = {
            method: request.method,
            path: request.url,
            status,
        };
        if (status >= 500) {
            this.logger.failure(AllExceptionsFilter_1.name, 'HTTP request failed', exception, metadata);
            return;
        }
        this.logger.warning(AllExceptionsFilter_1.name, 'HTTP request rejected', {
            ...metadata,
            reason: message,
        });
    }
    normalizeBody(response) {
        return typeof response === 'string' ? { message: response } : (response ?? {});
    }
    getMessage(exception) {
        if (exception instanceof Error) {
            return exception.message;
        }
        return String(exception);
    }
};
exports.AllExceptionsFilter = AllExceptionsFilter;
exports.AllExceptionsFilter = AllExceptionsFilter = AllExceptionsFilter_1 = __decorate([
    (0, common_1.Catch)(),
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [log_manager_service_1.LogManager])
], AllExceptionsFilter);
//# sourceMappingURL=all-exceptions.filter.js.map