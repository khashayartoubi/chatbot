import { HttpService } from '@nestjs/axios';
import { BadGatewayException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { Readable } from 'node:stream';
import { firstValueFrom } from 'rxjs';
import { I18nMessageService } from '../common/i18n/i18n-message.service';
import { externalHttpException } from '../common/http/external-http-exception';
import { ProjectsService } from '../projects/projects.service';
import { UploadsService } from '../uploads/uploads.service';
import type { FileManagerListQueryDto } from './dto/file-manager-list-query.dto';
import type { FileManagerResponse } from './interfaces/file-manager-response.interface';

@Injectable()
export class FileManagerService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly projectsService: ProjectsService,
    private readonly uploadsService: UploadsService,
    private readonly messages: I18nMessageService
  ) {}

  async getRecent(query: FileManagerListQueryDto, token: string): Promise<unknown> {
    const folderPath = query.folderId ? `${encodeURIComponent(query.folderId)}/` : '';
    const url = `${this.baseUrl()}/files-folders/list/${folderPath}contents`;
    const response = await this.request(() =>
      firstValueFrom(
        this.httpService.get<FileManagerResponse>(url, {
          headers: this.authorization(token),
          params: { page: query.page, limit: query.limit },
        })
      )
    );
    return response.data.data;
  }

  async getStorage(token: string): Promise<unknown> {
    const url = `${this.baseUrl()}/users/storage`;
    const response = await this.request(() =>
      firstValueFrom(
        this.httpService.get<FileManagerResponse>(url, {
          headers: this.authorization(token),
        })
      )
    );
    return response.data.data;
  }

  async upload(files: Express.Multer.File[], folderId: string, token: string): Promise<unknown> {
    const url = `${this.baseUrl()}/files`;
    const form = new FormData();
    form.append('folderId', folderId);
    form.append('location', this.location());

    try {
      for (const file of files) {
        form.append('files', new Blob([await readFile(file.path)], { type: file.mimetype }), file.originalname);
      }
      const response = await this.request(() =>
        firstValueFrom(
          this.httpService.post<FileManagerResponse>(url, form, {
            headers: this.authorization(token),
            maxBodyLength: this.maxFileSize() * files.length,
            maxContentLength: this.maxFileSize() * files.length,
          })
        )
      );
      return response.data.data;
    } finally {
      await this.removeTempFiles(files);
    }
  }

  async import(fileIds: string[], collectionId: string, username: string, token: string) {
    await this.projectsService.findOwnedCollection(collectionId, username);
    const files: Express.Multer.File[] = [];

    try {
      for (const fileId of fileIds) {
        files.push(await this.download(fileId, token));
      }
      return await this.uploadsService.create(files, username, collectionId);
    } catch (error) {
      await this.removeTempFiles(files);
      throw error;
    }
  }

  private async download(fileId: string, token: string): Promise<Express.Multer.File> {
    const url = `${this.baseUrl()}/files/download`;
    const response = await this.request(() =>
      firstValueFrom(
        this.httpService.post<ArrayBuffer>(
          url,
          { fileIds: [fileId] },
          {
            headers: this.authorization(token),
            responseType: 'arraybuffer',
            maxContentLength: this.maxFileSize(),
          }
        )
      )
    );
    const buffer = Buffer.from(response.data);
    const originalname = this.responseFileName(response.headers['content-disposition'], fileId);
    const directory = this.tempDirectory();
    const path = join(directory, randomUUID());
    await mkdir(directory, { recursive: true });
    await writeFile(path, buffer);

    return {
      fieldname: 'files',
      originalname,
      encoding: '7bit',
      mimetype: String(response.headers['content-type'] ?? 'application/octet-stream'),
      size: buffer.length,
      destination: directory,
      filename: basename(path),
      path,
      buffer,
      stream: Readable.from(buffer),
    };
  }

  private async request<T>(callback: () => Promise<T>): Promise<T> {
    try {
      return await callback();
    } catch (error) {
      throw (await externalHttpException(error)) ?? new BadGatewayException(this.messages.translate('fileManager.unavailable'));
    }
  }

  private baseUrl(): string {
    const url = this.configService.get<string>('DM_BASE_ASISSTANT_LANGUAGE_URL');
    if (!url) {
      throw new ServiceUnavailableException(this.messages.translate('fileManager.notConfigured'));
    }
    return url.replace(/\/$/, '');
  }

  private location(): string {
    return this.configService.get<string>('DM_LOCATION_ASISSTANT_LANGUAGE', 'assistant-language');
  }

  private maxFileSize(): number {
    return this.configService.get<number>('UPLOAD_MAX_FILE_SIZE', 100 * 1024 * 1024);
  }

  private tempDirectory(): string {
    return this.configService.get<string>('UPLOAD_TEMP_DIR', '/tmp/dana-uploads');
  }

  private authorization(token: string): { Authorization: string } {
    return { Authorization: `Bearer ${token}` };
  }

  private responseFileName(disposition: unknown, fallback: string): string {
    if (typeof disposition !== 'string') {
      return fallback;
    }
    const encoded = /filename\*=UTF-8''([^;]+)/i.exec(disposition)?.[1];
    const plain = /filename="?([^";]+)"?/i.exec(disposition)?.[1];
    try {
      return decodeURIComponent(encoded ?? plain ?? fallback);
    } catch {
      return encoded ?? plain ?? fallback;
    }
  }

  private async removeTempFiles(files: Express.Multer.File[]): Promise<void> {
    await Promise.all(files.map((file) => unlink(file.path).catch(() => undefined)));
  }
}
