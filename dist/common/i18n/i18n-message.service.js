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
exports.I18nMessageService = void 0;
const common_1 = require("@nestjs/common");
const nestjs_i18n_1 = require("nestjs-i18n");
const node_async_hooks_1 = require("node:async_hooks");
const language_enum_1 = require("./enums/language.enum");
let I18nMessageService = class I18nMessageService {
    i18n;
    languageContext = new node_async_hooks_1.AsyncLocalStorage();
    constructor(i18n) {
        this.i18n = i18n;
    }
    runInRequest(callback) {
        return this.languageContext.run({ language: language_enum_1.Language.PERSIAN }, callback);
    }
    setLanguage(language) {
        const store = this.languageContext.getStore();
        if (store) {
            store.language = language === String(language_enum_1.Language.ENGLISH) ? language_enum_1.Language.ENGLISH : language_enum_1.Language.PERSIAN;
        }
    }
    translate(key) {
        const language = this.languageContext.getStore()?.language ?? nestjs_i18n_1.I18nContext.current()?.lang ?? language_enum_1.Language.PERSIAN;
        return this.i18n.translate(`messages.${key}`, language ? { lang: language } : undefined);
    }
};
exports.I18nMessageService = I18nMessageService;
exports.I18nMessageService = I18nMessageService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [nestjs_i18n_1.I18nService])
], I18nMessageService);
//# sourceMappingURL=i18n-message.service.js.map