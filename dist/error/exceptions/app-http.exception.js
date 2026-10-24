"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppHttpException = void 0;
const common_1 = require("@nestjs/common");
class AppHttpException extends common_1.HttpException {
    constructor(message, status, _options) {
        void _options;
        super({
            success: false,
            status,
            message: Array.isArray(message) ? message.join(', ') : message,
            data: [],
        }, status);
    }
}
exports.AppHttpException = AppHttpException;
//# sourceMappingURL=app-http.exception.js.map