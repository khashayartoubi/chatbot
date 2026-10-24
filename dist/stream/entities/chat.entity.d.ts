import type { Relation } from 'typeorm';
import { Project } from '../../projects/entities/project.entity';
import { ChatType } from '../enums/chat-type.enum';
import { ChatMessage } from './chat-message.entity';
import { AnswerStatus } from '../enums/answer-status.enum';
export declare class Chat {
    id: string;
    type: ChatType;
    username: string;
    sessionId?: string;
    historyId?: string;
    projectId?: string;
    project?: Relation<Project>;
    messages: Relation<ChatMessage[]>;
    historyName: string;
    translate: string[];
    reasoning: boolean;
    modelName: string;
    state: string;
    waiting: boolean;
    answerStatus: AnswerStatus;
    isActive: boolean;
    pinned: boolean;
    createdAt: Date;
    updatedAt: Date;
}
