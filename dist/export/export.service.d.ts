import { Repository } from 'typeorm';
import { I18nMessageService } from '../common/i18n/i18n-message.service';
import { Project } from '../projects/entities/project.entity';
import { ChatMessage } from '../stream/entities/chat-message.entity';
import { Chat } from '../stream/entities/chat.entity';
import { ExportSessionDto } from './dto/export-session.dto';
import type { ExportedSession } from './interfaces/exported-session.interface';
export declare class ExportService {
    private readonly chatsRepository;
    private readonly messagesRepository;
    private readonly projectsRepository;
    private readonly i18nMessages;
    constructor(chatsRepository: Repository<Chat>, messagesRepository: Repository<ChatMessage>, projectsRepository: Repository<Project>, i18nMessages: I18nMessageService);
    export(dto: ExportSessionDto, username: string): Promise<ExportedSession>;
    private getProjectId;
    private toText;
    private toPdf;
}
