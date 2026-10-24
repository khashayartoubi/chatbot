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
exports.LanguageContextMiddleware = void 0;
const common_1 = require("@nestjs/common");
const i18n_message_service_1 = require("../i18n/i18n-message.service");
let LanguageContextMiddleware = class LanguageContextMiddleware {
    messages;
    constructor(messages) {
        this.messages = messages;
    }
    use(_request, _response, next) {
        this.messages.runInRequest(() => next());
    }
};
exports.LanguageContextMiddleware = LanguageContextMiddleware;
exports.LanguageContextMiddleware = LanguageContextMiddleware = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [i18n_message_service_1.I18nMessageService])
], LanguageContextMiddleware);
//# sourceMappingURL=language-context.middleware.js.map