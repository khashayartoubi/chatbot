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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var SocketGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketGateway = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const websockets_1 = require("@nestjs/websockets");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const active_session_service_1 = require("../auth/services/active-session.service");
const user_management_service_1 = require("../auth/services/user-management.service");
const log_manager_service_1 = require("../common/logger/log-manager.service");
const i18n_message_service_1 = require("../common/i18n/i18n-message.service");
const socket_events_service_1 = require("./services/socket-events.service");
const save_graph_position_dto_1 = require("./dto/save-graph-position.dto");
const ai_node_position_entity_1 = require("./entities/ai-node-position.entity");
let SocketGateway = SocketGateway_1 = class SocketGateway {
    userManagementService;
    activeSessionService;
    socketEventsService;
    logger;
    messages;
    nodePositionsRepository;
    server;
    constructor(userManagementService, activeSessionService, socketEventsService, logger, messages, nodePositionsRepository) {
        this.userManagementService = userManagementService;
        this.activeSessionService = activeSessionService;
        this.socketEventsService = socketEventsService;
        this.logger = logger;
        this.messages = messages;
        this.nodePositionsRepository = nodePositionsRepository;
    }
    afterInit(server) {
        const events = [
            'aiAssistantMessage',
            'aiAssistantMessageHistory',
            'aiAssistantMessageStart',
            'aiAssistantMessageEnd',
            'aiAssistantMessageError',
            'aiCollections',
            'aiHistory',
            'aiNewHistory',
        ];
        events.forEach((event) => {
            this.socketEventsService.on(event, (username, payload) => {
                server.to(this.userRoom(username)).emit(event, payload);
            });
        });
        this.logger.info(SocketGateway_1.name, 'Socket gateway initialized', {
            eventCount: events.length,
        });
    }
    async handleConnection(client) {
        const token = this.getToken(client);
        if (!token) {
            this.logger.warning(SocketGateway_1.name, 'Socket connection rejected because token is missing', {
                socketId: client.id,
                ip: client.handshake.address.replace('::ffff:', ''),
            });
            client.disconnect();
            return;
        }
        try {
            const user = await this.userManagementService.fetchUserInfo(token);
            client.data.username = user.username;
            client.data.token = token;
            await client.join(this.userRoom(user.username));
            const previousSockets = await this.server.in(this.userRoom(user.username)).fetchSockets();
            previousSockets
                .filter((socket) => socket.id !== client.id)
                .forEach((socket) => {
                socket.emit('msg', `Socket connection updated and connection ID changed from ${socket.id} to ${client.id}`);
            });
            this.activeSessionService.register(user.username, token, client.handshake.address.replace('::ffff:', ''));
            this.logger.info(SocketGateway_1.name, 'Socket connected', {
                username: user.username,
                socketId: client.id,
                ip: client.handshake.address.replace('::ffff:', ''),
            });
        }
        catch (error) {
            this.logger.failure(SocketGateway_1.name, 'Socket authentication failed', error, {
                socketId: client.id,
                ip: client.handshake.address.replace('::ffff:', ''),
            });
            client.emit('authenticationError', {
                success: false,
                status: 401,
                message: this.messages.translate('auth.invalidToken'),
                data: [],
            });
            client.disconnect();
        }
    }
    async handleDisconnect(client) {
        const username = client.data.username;
        if (!username) {
            return;
        }
        const sockets = await this.server.in(this.userRoom(username)).fetchSockets();
        if (!sockets.length) {
            this.activeSessionService.remove(username);
        }
        this.logger.info(SocketGateway_1.name, 'Socket disconnected', {
            username,
            socketId: client.id,
        });
    }
    ping(client) {
        return {
            event: 'pong',
            data: { connected: Boolean(client.data.username) },
        };
    }
    async saveGraphPosition(client, payload) {
        const username = client.data.username;
        if (!username) {
            client.disconnect();
            return;
        }
        const dto = (0, class_transformer_1.plainToInstance)(save_graph_position_dto_1.SaveGraphPositionDto, payload);
        if ((await (0, class_validator_1.validate)(dto)).length) {
            this.logger.warning(SocketGateway_1.name, 'Invalid graph position payload ignored', {
                username,
                socketId: client.id,
            });
            return;
        }
        await this.nodePositionsRepository.save(this.nodePositionsRepository.create({
            username,
            positions: dto.position.map(({ id, fx, fy }) => ({ id, fx, fy })),
        }));
        this.logger.trace(SocketGateway_1.name, 'Graph positions saved', {
            username,
            positionCount: dto.position.length,
        });
    }
    getToken(client) {
        const auth = client.handshake.auth;
        const authToken = auth.token;
        if (typeof authToken === 'string') {
            return authToken.replace(/^Bearer\s+/i, '');
        }
        const authorization = client.handshake.headers.authorization;
        return authorization?.replace(/^Bearer\s+/i, '');
    }
    userRoom(username) {
        return `user:${username}`;
    }
};
exports.SocketGateway = SocketGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", Function)
], SocketGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('ping'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SocketGateway.prototype, "ping", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('save-ai-graph-position'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, save_graph_position_dto_1.SaveGraphPositionDto]),
    __metadata("design:returntype", Promise)
], SocketGateway.prototype, "saveGraphPosition", null);
exports.SocketGateway = SocketGateway = SocketGateway_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, websockets_1.WebSocketGateway)({
        cors: { origin: '*' },
    }),
    __param(5, (0, typeorm_1.InjectRepository)(ai_node_position_entity_1.AiNodePosition)),
    __metadata("design:paramtypes", [user_management_service_1.UserManagementService,
        active_session_service_1.ActiveSessionService,
        socket_events_service_1.SocketEventsService,
        log_manager_service_1.LogManager,
        i18n_message_service_1.I18nMessageService, Function])
], SocketGateway);
//# sourceMappingURL=socket.gateway.js.map