import type { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { Chat } from '../stream/entities/chat.entity';
import { StreamService } from '../stream/stream.service';
import { SocketEventsService } from '../socket/services/socket-events.service';
import { UpdateUserMessageDto } from '../stream/dto/update-user-message.dto';
import { EditGeneralSessionDto } from './dto/edit-general-session.dto';
import { GeneralFile } from './entities/general-file.entity';
import { GeneralHistory } from './entities/general-history.entity';
export declare class GeneralService {
    private readonly streamService;
    private readonly socketEventsService;
    constructor(streamService: StreamService, socketEventsService: SocketEventsService);
    getHistories(username: string, pagination?: PaginationQueryDto): Promise<GeneralHistory[]>;
    getHistoryFiles(username: string, historyId: string): Promise<GeneralFile[]>;
    getMessages(username: string, historyId: string, pagination?: PaginationQueryDto): Promise<{
        id: string;
        unread: boolean;
        type: string;
        selectionMode: import("../stream/enums/selection-mode.enum").SelectionMode | undefined;
        messageType: import("../stream/enums/selection-mode.enum").SelectionMode | undefined;
        message: string;
        bot: boolean;
        answerStatus: import("../stream/enums/answer-status.enum").AnswerStatus;
        avatar: string;
        attachments: unknown[];
        liked: boolean;
        disLiked: boolean;
        starred: boolean;
        delivered: boolean;
        createdAt: {
            $date: string;
        };
        comment: string;
        translate: string[];
        reply: unknown[];
    }[]>;
    editSession(dto: EditGeneralSessionDto, username: string): Promise<Chat>;
    remove(historyId: string, username: string): Promise<void>;
    removeAll(username: string): Promise<number>;
    updateMessage(dto: UpdateUserMessageDto, username: string): Promise<void>;
    private emitHistory;
}
