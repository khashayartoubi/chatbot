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
var ProcessErrorHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcessErrorHandler = void 0;
const common_1 = require("@nestjs/common");
const log_manager_service_1 = require("../../common/logger/log-manager.service");
let ProcessErrorHandler = ProcessErrorHandler_1 = class ProcessErrorHandler {
    logger;
    constructor(logger) {
        this.logger = logger;
    }
    onApplicationBootstrap() {
        process.on('unhandledRejection', this.handleUnhandledRejection);
        process.on('uncaughtException', this.handleUncaughtException);
    }
    onApplicationShutdown() {
        process.off('unhandledRejection', this.handleUnhandledRejection);
        process.off('uncaughtException', this.handleUncaughtException);
    }
    handleUnhandledRejection = (reason) => {
        this.logger.failure(ProcessErrorHandler_1.name, 'Unhandled promise rejection', reason);
    };
    handleUncaughtException = (error) => {
        this.logger.failure(ProcessErrorHandler_1.name, 'Uncaught application exception', error);
    };
};
exports.ProcessErrorHandler = ProcessErrorHandler;
exports.ProcessErrorHandler = ProcessErrorHandler = ProcessErrorHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [log_manager_service_1.LogManager])
], ProcessErrorHandler);
//# sourceMappingURL=process-error-handler.service.js.map