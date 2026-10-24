"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PinModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const auth_module_1 = require("../auth/auth.module");
const project_entity_1 = require("../projects/entities/project.entity");
const projects_module_1 = require("../projects/projects.module");
const socket_module_1 = require("../socket/socket.module");
const chat_entity_1 = require("../stream/entities/chat.entity");
const stream_module_1 = require("../stream/stream.module");
const pin_controller_1 = require("./pin.controller");
const pin_service_1 = require("./pin.service");
let PinModule = class PinModule {
};
exports.PinModule = PinModule;
exports.PinModule = PinModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([chat_entity_1.Chat, project_entity_1.Project]), auth_module_1.AuthModule, stream_module_1.StreamModule, socket_module_1.SocketModule, projects_module_1.ProjectsModule],
        controllers: [pin_controller_1.PinController],
        providers: [pin_service_1.PinService],
    })
], PinModule);
//# sourceMappingURL=pin.module.js.map