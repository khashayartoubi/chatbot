"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreamModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const dana_module_1 = require("../dana/dana.module");
const auth_module_1 = require("../auth/auth.module");
const project_entity_1 = require("../projects/entities/project.entity");
const socket_module_1 = require("../socket/socket.module");
const uploads_module_1 = require("../uploads/uploads.module");
const chat_message_entity_1 = require("./entities/chat-message.entity");
const chat_entity_1 = require("./entities/chat.entity");
const stream_service_1 = require("./stream.service");
const stream_controller_1 = require("./stream.controller");
const stream_payload_pipe_1 = require("./pipes/stream-payload.pipe");
let StreamModule = class StreamModule {
};
exports.StreamModule = StreamModule;
exports.StreamModule = StreamModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([chat_entity_1.Chat, chat_message_entity_1.ChatMessage, project_entity_1.Project]), auth_module_1.AuthModule, uploads_module_1.UploadsModule, dana_module_1.DanaModule, socket_module_1.SocketModule],
        controllers: [stream_controller_1.StreamController],
        providers: [stream_service_1.StreamService, stream_payload_pipe_1.StreamPayloadPipe],
        exports: [stream_service_1.StreamService],
    })
], StreamModule);
//# sourceMappingURL=stream.module.js.map