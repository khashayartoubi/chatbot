import { MessageType } from '../enums/message-type.enum';

export class SendMessageDto {
  messageId?: string;
  unread?: boolean;
  type?: MessageType;
  message!: string;
  text?: string;
  letter_operation?: string;
  translate?: string;
  avatar?: string;
  attachments: string[] = [];
  liked?: boolean;
  disLiked?: boolean;
  starred?: boolean;
  delivered?: boolean;
  comment?: string;
  reply?: unknown[];
  createdAt?: string;
}
