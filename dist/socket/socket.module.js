"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const auth_module_1 = require("../auth/auth.module");
const ai_node_position_entity_1 = require("./entities/ai-node-position.entity");
const socket_events_service_1 = require("./services/socket-events.service");
const socket_gateway_1 = require("./socket.gateway");
let SocketModule = class SocketModule {
};
exports.SocketModule = SocketModule;
exports.SocketModule = SocketModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([ai_node_position_entity_1.AiNodePosition]), auth_module_1.AuthModule],
        providers: [socket_gateway_1.SocketGateway, socket_events_service_1.SocketEventsService],
        exports: [socket_events_service_1.SocketEventsService],
    })
], SocketModule);
//# sourceMappingURL=socket.module.js.map