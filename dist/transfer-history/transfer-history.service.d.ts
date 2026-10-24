import { DataSource } from 'typeorm';
import { I18nMessageService } from '../common/i18n/i18n-message.service';
import { ProjectsService } from '../projects/projects.service';
import { SocketEventsService } from '../socket/services/socket-events.service';
import { StreamService } from '../stream/stream.service';
import type { TransferHistoryDto } from './dto/transfer-history.dto';
import type { TransferHistoryResult } from './interfaces/transfer-history-result.interface';
export declare class TransferHistoryService {
    private readonly dataSource;
    private readonly streamService;
    private readonly projectsService;
    private readonly socketEventsService;
    private readonly messages;
    constructor(dataSource: DataSource, streamService: StreamService, projectsService: ProjectsService, socketEventsService: SocketEventsService, messages: I18nMessageService);
    transfer(dto: TransferHistoryDto, username: string): Promise<TransferHistoryResult>;
}
