import type { ChatMessage } from '../entities/chat-message.entity';

export interface UpdatedMessagePair {
  userMessage: ChatMessage;
  botMessage: ChatMessage;
  removedFileIds: string[];
}
