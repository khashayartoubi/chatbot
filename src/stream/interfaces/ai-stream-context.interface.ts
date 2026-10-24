import type { UploadsService } from '../../uploads/uploads.service';
import type { ChatMessage } from '../entities/chat-message.entity';
import type { SelectionMode } from '../enums/selection-mode.enum';
import type { StreamScope } from '../enums/stream-scope.enum';

export interface AiStreamContext {
  username: string;
  prompt: string;
  attachments: Awaited<ReturnType<UploadsService['findAttachments']>>;
  userMessage: ChatMessage;
  text: string;
  letter_operation?: string;
  translate?: string;
  botMessage: ChatMessage;
  scope: StreamScope;
  historyId?: string;
  selectionMode: SelectionMode;
  projectId?: string;
}
