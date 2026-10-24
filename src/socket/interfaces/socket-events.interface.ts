import type { SaveGraphPositionDto } from '../dto/save-graph-position.dto';

export interface SocketData {
  username?: string;
  token?: string;
}

export interface ClientEvents {
  ping: () => void;
  'save-ai-graph-position': (payload: SaveGraphPositionDto) => void;
}

export interface ServerEvents {
  authenticationError: (payload: { success: boolean; status: number; message: string; data: unknown[] }) => void;
  msg: (message: string) => void;
}
