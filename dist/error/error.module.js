"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorModule = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const all_exceptions_filter_1 = require("./filters/all-exceptions.filter");
const process_error_handler_service_1 = require("./services/process-error-handler.service");
let ErrorModule = class ErrorModule {
};
exports.ErrorModule = ErrorModule;
exports.ErrorModule = ErrorModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        providers: [
            process_error_handler_service_1.ProcessErrorHandler,
            {
                provide: core_1.APP_FILTER,
                useClass: all_exceptions_filter_1.AllExceptionsFilter,
            },
        ],
    })
], ErrorModule);
//# sourceMappingURL=error.module.js.map