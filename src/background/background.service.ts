import { ConflictException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { unlink } from 'node:fs/promises';
import { I18nMessageService } from '../common/i18n/i18n-message.service';
import { normalizeFileName } from '../common/utils/normalize-file-name';
import { Repository } from 'typeorm';
import { MinioService } from '../storage/minio.service';
import { userObjectName } from '../storage/utils/user-object-name';
import { UpdateBackgroundDto } from './dto/update-background.dto';
import { Background } from './entities/background.entity';

@Injectable()
export class BackgroundService {
  constructor(
    @InjectRepository(Background)
    private readonly backgroundRepository: Repository<Background>,
    private readonly minioService: MinioService,
    private readonly messages: I18nMessageService
  ) {}

  async get(username: string): Promise<Background> {
    try {
      const background = await this.backgroundRepository.findOneBy({
        username,
      });
      return background ?? this.backgroundRepository.save(this.backgroundRepository.create({ username }));
    } catch {
      throw this.databaseError();
    }
  }

  async update(username: string, dto: UpdateBackgroundDto): Promise<Background> {
    const background = await this.get(username);
    background.userMessageBackgroundColor = dto.userMessageBackgroundColor ?? background.userMessageBackgroundColor;
    background.userMessageTextColor = dto.userMessageTextColor ?? background.userMessageTextColor;
    background.enabled = dto.enabled ?? background.enabled;
    background.fit = dto.fit ?? background.fit;
    background.overlay = dto.overlay ?? background.overlay;
    background.blur = dto.blur ?? background.blur;
    background.applyToAll = dto.applyToAll ?? background.applyToAll;
    try {
      return await this.backgroundRepository.save(background);
    } catch {
      throw this.databaseError();
    }
  }

  async uploadImage(username: string, file: Express.Multer.File): Promise<Background> {
    const objectName = userObjectName(username, 'backgrounds', randomUUID());
    try {
      await this.minioService.upload(file.path, objectName, file.mimetype);
    } catch {
      throw new ServiceUnavailableException(this.messages.translate('common.minioUnavailable'));
    } finally {
      await unlink(file.path).catch(() => undefined);
    }

    let background: Background;
    try {
      background = await this.get(username);
    } catch (error) {
      await this.minioService.remove(objectName).catch(() => undefined);
      throw error;
    }
    const previousObject = background.objectName;
    background.objectName = objectName;
    background.fullPath = this.minioService.getFullPath(objectName);
    background.originalName = normalizeFileName(file.originalname);
    background.mimeType = file.mimetype;

    try {
      const saved = await this.backgroundRepository.save(background);
      if (previousObject) {
        await this.minioService.remove(previousObject).catch(() => undefined);
      }
      return saved;
    } catch {
      await this.minioService.remove(objectName).catch(() => undefined);
      throw this.databaseError();
    }
  }

  async preview(username: string) {
    const background = await this.get(username);
    if (!background.objectName || !background.mimeType) {
      throw new ConflictException(this.messages.translate('background.notConfigured'));
    }
    try {
      return {
        background,
        ...(await this.minioService.preview(background.objectName)),
      };
    } catch {
      throw new ServiceUnavailableException(this.messages.translate('common.minioUnavailable'));
    }
  }

  private databaseError(): ServiceUnavailableException {
    return new ServiceUnavailableException(this.messages.translate('common.databaseUnavailable'));
  }
}
