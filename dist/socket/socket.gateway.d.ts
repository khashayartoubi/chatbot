import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit } from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import type { Repository } from 'typeorm';
import { ActiveSessionService } from '../auth/services/active-session.service';
import { UserManagementService } from '../auth/services/user-management.service';
import { LogManager } from '../common/logger/log-manager.service';
import { I18nMessageService } from '../common/i18n/i18n-message.service';
import { SocketEventsService } from './services/socket-events.service';
import type { ClientEvents, ServerEvents, SocketData } from './interfaces/socket-events.interface';
import { SaveGraphPositionDto } from './dto/save-graph-position.dto';
import { AiNodePosition } from './entities/ai-node-position.entity';
type AuthenticatedSocket = Socket<ClientEvents, ServerEvents, Record<string, never>, SocketData>;
export declare class SocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    private readonly userManagementService;
    private readonly activeSessionService;
    private readonly socketEventsService;
    private readonly logger;
    private readonly messages;
    private readonly nodePositionsRepository;
    private server;
    constructor(userManagementService: UserManagementService, activeSessionService: ActiveSessionService, socketEventsService: SocketEventsService, logger: LogManager, messages: I18nMessageService, nodePositionsRepository: Repository<AiNodePosition>);
    afterInit(server: Server): void;
    handleConnection(client: AuthenticatedSocket): Promise<void>;
    handleDisconnect(client: AuthenticatedSocket): Promise<void>;
    ping(client: AuthenticatedSocket): {
        event: string;
        data: {
            connected: boolean;
        };
    };
    saveGraphPosition(client: AuthenticatedSocket, payload: SaveGraphPositionDto): Promise<void>;
    private getToken;
    private userRoom;
}
export {};
