import type { GeneratedFileResponse } from './generated-file-response.interface';

export interface DanaJsonResponse {
  answer?: string;
  error?: string;
  generatedFile?: GeneratedFileResponse;
}
