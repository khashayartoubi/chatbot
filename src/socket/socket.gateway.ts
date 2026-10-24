import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConnectedSocket, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import type { Server, Socket } from 'socket.io';
import type { Repository } from 'typeorm';
import { ActiveSessionService } from '../auth/services/active-session.service';
import { UserManagementService } from '../auth/services/user-management.service';
import { LogManager } from '../common/logger/log-manager.service';
import { I18nMessageService } from '../common/i18n/i18n-message.service';
import { SocketEventsService } from './services/socket-events.service';
import type { ClientEvents, ServerEvents, SocketData } from './interfaces/socket-events.interface';
import type { SocketEvent } from './interfaces/socket-event.interface';
import { SaveGraphPositionDto } from './dto/save-graph-position.dto';
import { AiNodePosition } from './entities/ai-node-position.entity';

type AuthenticatedSocket = Socket<ClientEvents, ServerEvents, Record<string, never>, SocketData>;

@Injectable()
@WebSocketGateway({
  cors: { origin: '*' },
})
export class SocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private server!: Server;

  constructor(
    private readonly userManagementService: UserManagementService,
    private readonly activeSessionService: ActiveSessionService,
    private readonly socketEventsService: SocketEventsService,
    private readonly logger: LogManager,
    private readonly messages: I18nMessageService,
    @InjectRepository(AiNodePosition)
    private readonly nodePositionsRepository: Repository<AiNodePosition>
  ) {}

  afterInit(server: Server): void {
    const events: SocketEvent[] = [
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
    this.logger.info(SocketGateway.name, 'Socket gateway initialized', {
      eventCount: events.length,
    });
  }

  async handleConnection(client: AuthenticatedSocket): Promise<void> {
    const token = this.getToken(client);
    if (!token) {
      this.logger.warning(SocketGateway.name, 'Socket connection rejected because token is missing', {
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
      this.logger.info(SocketGateway.name, 'Socket connected', {
        username: user.username,
        socketId: client.id,
        ip: client.handshake.address.replace('::ffff:', ''),
      });
    } catch (error) {
      this.logger.failure(SocketGateway.name, 'Socket authentication failed', error, {
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

  async handleDisconnect(client: AuthenticatedSocket): Promise<void> {
    const username = client.data.username;
    if (!username) {
      return;
    }

    const sockets = await this.server.in(this.userRoom(username)).fetchSockets();
    if (!sockets.length) {
      this.activeSessionService.remove(username);
    }
    this.logger.info(SocketGateway.name, 'Socket disconnected', {
      username,
      socketId: client.id,
    });
  }

  @SubscribeMessage('ping')
  ping(@ConnectedSocket() client: AuthenticatedSocket) {
    return {
      event: 'pong',
      data: { connected: Boolean(client.data.username) },
    };
  }

  @SubscribeMessage('save-ai-graph-position')
  async saveGraphPosition(@ConnectedSocket() client: AuthenticatedSocket, payload: SaveGraphPositionDto): Promise<void> {
    const username = client.data.username;
    if (!username) {
      client.disconnect();
      return;
    }

    const dto = plainToInstance(SaveGraphPositionDto, payload);
    if ((await validate(dto)).length) {
      this.logger.warning(SocketGateway.name, 'Invalid graph position payload ignored', {
        username,
        socketId: client.id,
      });
      return;
    }

    await this.nodePositionsRepository.save(
      this.nodePositionsRepository.create({
        username,
        positions: dto.position.map(({ id, fx, fy }) => ({ id, fx, fy })),
      })
    );
    this.logger.trace(SocketGateway.name, 'Graph positions saved', {
      username,
      positionCount: dto.position.length,
    });
  }

  private getToken(client: AuthenticatedSocket): string | undefined {
    const auth = client.handshake.auth as { token?: unknown };
    const authToken = auth.token;
    if (typeof authToken === 'string') {
      return authToken.replace(/^Bearer\s+/i, '');
    }

    const authorization = client.handshake.headers.authorization;
    return authorization?.replace(/^Bearer\s+/i, '');
  }

  private userRoom(username: string): string {
    return `user:${username}`;
  }
}
