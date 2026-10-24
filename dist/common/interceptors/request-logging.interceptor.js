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
var RequestLoggingInterceptor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestLoggingInterceptor = void 0;
const common_1 = require("@nestjs/common");
const node_crypto_1 = require("node:crypto");
const rxjs_1 = require("rxjs");
const log_manager_service_1 = require("../logger/log-manager.service");
let RequestLoggingInterceptor = RequestLoggingInterceptor_1 = class RequestLoggingInterceptor {
    logger;
    constructor(logger) {
        this.logger = logger;
    }
    intercept(context, next) {
        const http = context.switchToHttp();
        const request = http.getRequest();
        const response = http.getResponse();
        const requestId = this.getRequestId(request);
        const startedAt = Date.now();
        response.setHeader('x-request-id', requestId);
        this.logger.trace(RequestLoggingInterceptor_1.name, 'HTTP request started', {
            requestId,
            method: request.method,
            path: request.originalUrl,
            username: request.userName,
            ip: request.ip,
        });
        return next.handle().pipe((0, rxjs_1.tap)(() => {
            this.logger.info(RequestLoggingInterceptor_1.name, 'HTTP request completed', {
                requestId,
                method: request.method,
                path: request.originalUrl,
                username: request.userName,
                status: response.statusCode,
                durationMs: Date.now() - startedAt,
            });
        }));
    }
    getRequestId(request) {
        const header = request.headers['x-request-id'];
        const requestId = Array.isArray(header) ? header[0] : header;
        return requestId?.trim() || (0, node_crypto_1.randomUUID)();
    }
};
exports.RequestLoggingInterceptor = RequestLoggingInterceptor;
exports.RequestLoggingInterceptor = RequestLoggingInterceptor = RequestLoggingInterceptor_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [log_manager_service_1.LogManager])
], RequestLoggingInterceptor);
//# sourceMappingURL=request-logging.interceptor.js.map