import { StreamMessageType } from '../../stream/enums/stream-message-type.enum';
import { StreamScope } from '../../stream/enums/stream-scope.enum';

export interface SocketPayload {
  chatId: string;
  historyId: string;
  messageId: string;
  scope: StreamScope;
  type?: StreamMessageType.DONE | StreamMessageType.FAILURE;
  attachments?: SocketAttachment[];
  messages?: unknown[];
  file?: { fileId: string; filename: string; downloadUrl: string };
}

export interface SocketAttachment {
  fileId: string;
  originalName: string;
  mimeType: string;
  size: number;
}

export type SocketEvent =
  | 'aiAssistantMessage'
  | 'aiAssistantMessageHistory'
  | 'aiAssistantMessageStart'
  | 'aiAssistantMessageEnd'
  | 'aiAssistantMessageError'
  | 'aiCollections'
  | 'aiHistory'
  | 'aiNewHistory';

export type SocketListener = (username: string, payload: object) => void;
