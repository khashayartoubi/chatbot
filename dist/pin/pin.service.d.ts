import { Repository } from 'typeorm';
import { I18nMessageService } from '../common/i18n/i18n-message.service';
import { Project } from '../projects/entities/project.entity';
import { ProjectsService } from '../projects/projects.service';
import { Chat } from '../stream/entities/chat.entity';
import { SocketEventsService } from '../socket/services/socket-events.service';
import { StreamService } from '../stream/stream.service';
import type { PinSessionDto } from './dto/pin-session.dto';
import type { PinResult } from './interfaces/pin-result.interface';
export declare class PinService {
    private readonly chatsRepository;
    private readonly projectsRepository;
    private readonly streamService;
    private readonly projectsService;
    private readonly socketEventsService;
    private readonly messages;
    constructor(chatsRepository: Repository<Chat>, projectsRepository: Repository<Project>, streamService: StreamService, projectsService: ProjectsService, socketEventsService: SocketEventsService, messages: I18nMessageService);
    toggle(dto: PinSessionDto, username: string): Promise<PinResult>;
    private toggleProject;
    private toggleConversation;
    private findProject;
    private emitProjects;
    private databaseError;
}
