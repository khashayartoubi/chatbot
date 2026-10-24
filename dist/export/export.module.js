"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const auth_module_1 = require("../auth/auth.module");
const project_entity_1 = require("../projects/entities/project.entity");
const chat_message_entity_1 = require("../stream/entities/chat-message.entity");
const chat_entity_1 = require("../stream/entities/chat.entity");
const export_controller_1 = require("./export.controller");
const export_service_1 = require("./export.service");
let ExportModule = class ExportModule {
};
exports.ExportModule = ExportModule;
exports.ExportModule = ExportModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([chat_entity_1.Chat, chat_message_entity_1.ChatMessage, project_entity_1.Project]), auth_module_1.AuthModule],
        controllers: [export_controller_1.ExportController],
        providers: [export_service_1.ExportService],
    })
], ExportModule);
//# sourceMappingURL=export.module.js.map