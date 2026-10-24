export interface GeneratedFileResponse {
  text: string;
  objectKey: string;
  bucket: string;
  presignedUrl: string;
}

export type GeneratedFileHandler = (file: GeneratedFileResponse) => Promise<void> | void;
