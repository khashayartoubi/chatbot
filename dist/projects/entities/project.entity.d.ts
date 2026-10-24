import type { Relation } from 'typeorm';
import { Chat } from '../../stream/entities/chat.entity';
import { Upload } from '../../uploads/entities/upload.entity';
export declare class Project {
    id: string;
    collectionId: string;
    name: string;
    color: string;
    icon: string;
    username: string;
    pinned: boolean;
    chats: Relation<Chat[]>;
    uploads: Relation<Upload[]>;
    createdAt: Date;
    updatedAt: Date;
}
