"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InfrastructureUnavailableException = void 0;
const common_1 = require("@nestjs/common");
const app_http_exception_1 = require("./app-http.exception");
class InfrastructureUnavailableException extends app_http_exception_1.AppHttpException {
    constructor(service, code, cause) {
        const causeMessage = cause instanceof Error ? cause.message : String(cause);
        super(`${service} service is unavailable: ${causeMessage}`, common_1.HttpStatus.SERVICE_UNAVAILABLE, {
            code,
        });
    }
}
exports.InfrastructureUnavailableException = InfrastructureUnavailableException;
//# sourceMappingURL=infrastructure-unavailable.exception.js.map