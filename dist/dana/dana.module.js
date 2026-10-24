"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DanaModule = void 0;
const common_1 = require("@nestjs/common");
const prompt_module_1 = require("../prompt/prompt.module");
const dana_service_1 = require("./dana.service");
let DanaModule = class DanaModule {
};
exports.DanaModule = DanaModule;
exports.DanaModule = DanaModule = __decorate([
    (0, common_1.Module)({
        imports: [prompt_module_1.PromptModule],
        providers: [dana_service_1.DanaService],
        exports: [dana_service_1.DanaService],
    })
], DanaModule);
//# sourceMappingURL=dana.module.js.map