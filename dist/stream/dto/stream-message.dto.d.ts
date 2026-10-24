import { MessageType } from '../enums/message-type.enum';
import { SelectionMode } from '../enums/selection-mode.enum';
import { AnswerStatus } from '../enums/answer-status.enum';
export declare class StreamChatMessageDto {
    id?: string;
    unread: boolean;
    type: MessageType;
    message: string;
    text?: string;
    letter_operation?: string;
    bot: boolean;
    avatar: string;
    attachments: string[];
    liked: boolean;
    disLiked: boolean;
    starred: boolean;
    delivered: boolean;
    comment: string;
    reply: unknown[];
    createdAt?: string;
}
declare class MessageSchemaDto {
    message: StreamChatMessageDto;
}
export declare class StreamMessageDto {
    answerStatus?: AnswerStatus;
    retry: boolean;
    historyId?: string;
    collectionId?: string | null;
    projectId?: string;
    sessionId?: string;
    selectionMode: SelectionMode;
    letter_operation?: string;
    translate?: string;
    fileIds: string[];
    messageSchema: MessageSchemaDto;
}
export declare class StreamMultipartDto {
    payload: StreamMessageDto;
}
export {};
