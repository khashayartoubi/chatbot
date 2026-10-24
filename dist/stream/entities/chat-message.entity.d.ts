import type { Relation } from 'typeorm';
import { Chat } from './chat.entity';
import { SelectionMode } from '../enums/selection-mode.enum';
import { AnswerStatus } from '../enums/answer-status.enum';
export declare class ChatMessage {
    id: string;
    chatId: string;
    chat: Relation<Chat>;
    sequence: number;
    unread: boolean;
    type: string;
    selectionMode?: SelectionMode;
    messageType?: SelectionMode;
    message: string;
    text: string;
    bot: boolean;
    answerStatus: AnswerStatus;
    avatar: string;
    attachments: unknown[];
    liked: boolean;
    disLiked: boolean;
    starred: boolean;
    delivered: boolean;
    createdAt: Date;
    comment: string;
    translate: string[];
    reply: unknown[];
}
