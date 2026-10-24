"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommonModule = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const i18n_message_service_1 = require("./i18n/i18n-message.service");
const request_logging_interceptor_1 = require("./interceptors/request-logging.interceptor");
const log_manager_service_1 = require("./logger/log-manager.service");
const language_context_middleware_1 = require("./middleware/language-context.middleware");
let CommonModule = class CommonModule {
    configure(consumer) {
        consumer.apply(language_context_middleware_1.LanguageContextMiddleware).forRoutes('{*path}');
    }
};
exports.CommonModule = CommonModule;
exports.CommonModule = CommonModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        providers: [
            log_manager_service_1.LogManager,
            i18n_message_service_1.I18nMessageService,
            language_context_middleware_1.LanguageContextMiddleware,
            {
                provide: core_1.APP_INTERCEPTOR,
                useClass: request_logging_interceptor_1.RequestLoggingInterceptor,
            },
        ],
        exports: [log_manager_service_1.LogManager, i18n_message_service_1.I18nMessageService],
    })
], CommonModule);
//# sourceMappingURL=common.module.js.map