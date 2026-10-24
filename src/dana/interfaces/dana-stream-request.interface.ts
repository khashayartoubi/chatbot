import type { Upload } from '../../uploads/entities/upload.entity';
import type { SelectionMode } from '../../stream/enums/selection-mode.enum';

export interface DanaStreamRequest {
  userQuery: string;
  username: string;
  history: unknown[];
  historyCount: number;
  text?: string;
  letter_operation?: string;
  translate?: string;
  selectionMode: SelectionMode;
  files: Upload[];
}
