import { Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import PDFDocument from 'pdfkit';
import { IsNull, Repository } from 'typeorm';
import { I18nMessageService } from '../common/i18n/i18n-message.service';
import { Project } from '../projects/entities/project.entity';
import { ChatMessage } from '../stream/entities/chat-message.entity';
import { Chat } from '../stream/entities/chat.entity';
import { ChatType } from '../stream/enums/chat-type.enum';
import { ExportSessionDto } from './dto/export-session.dto';
import { ExportFormat } from './enums/export-format.enum';
import type { ExportedSession } from './interfaces/exported-session.interface';

@Injectable()
export class ExportService {
  constructor(
    @InjectRepository(Chat)
    private readonly chatsRepository: Repository<Chat>,
    @InjectRepository(ChatMessage)
    private readonly messagesRepository: Repository<ChatMessage>,
    @InjectRepository(Project)
    private readonly projectsRepository: Repository<Project>,
    private readonly i18nMessages: I18nMessageService
  ) {}

  async export(dto: ExportSessionDto, username: string): Promise<ExportedSession> {
    const projectId = await this.getProjectId(dto.collectionId, username);

    let chat: Chat | null;
    let messages: ChatMessage[];
    try {
      chat = await this.chatsRepository.findOne({
        where: {
          username,
          type: projectId ? ChatType.PROJECT : ChatType.GENERAL,
          projectId: projectId ?? IsNull(),
          ...(projectId ? { sessionId: dto.historyId } : { historyId: dto.historyId }),
        },
      });

      if (!chat) {
        throw new NotFoundException(this.i18nMessages.translate('conversation.notFound'));
      }

      messages = await this.messagesRepository.find({
        where: { chatId: chat.id },
        order: { sequence: 'ASC' },
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new ServiceUnavailableException(this.i18nMessages.translate('common.databaseUnavailable'));
    }

    const text = this.toText(chat, messages);
    const filename = `session-${dto.historyId}.${dto.format}`;

    if (dto.format === ExportFormat.TEXT) {
      return {
        content: Buffer.from(text, 'utf8'),
        filename,
        mimeType: 'text/plain; charset=utf-8',
      };
    }

    return {
      content: await this.toPdf(text),
      filename,
      mimeType: 'application/pdf',
    };
  }

  private async getProjectId(collectionId: string | undefined, username: string): Promise<string | undefined> {
    if (!collectionId) {
      return undefined;
    }

    let project: Project | null;
    try {
      project = await this.projectsRepository.findOneBy({
        collectionId,
        username,
      });
    } catch {
      throw new ServiceUnavailableException(this.i18nMessages.translate('common.databaseUnavailable'));
    }

    if (!project) {
      throw new NotFoundException(this.i18nMessages.translate('project.notFound'));
    }
    return project.id;
  }

  private toText(chat: Chat, messages: ChatMessage[]): string {
    const title = chat.historyName || `گفتگو ${chat.historyId ?? chat.sessionId ?? chat.id}`;
    const body = messages.map((message) => {
      const sender = message.bot ? 'دستیار' : 'کاربر';
      const createdAt = new Date(message.createdAt).toISOString();
      return `${sender} - ${createdAt}\n${message.message}`;
    });

    return [title, '', ...body.flatMap((message) => [message, ''])].join('\n');
  }

  private toPdf(text: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const document = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: { Title: 'Chat session' },
      });
      const chunks: Buffer[] = [];

      document.on('data', (chunk: Buffer) => chunks.push(chunk));
      document.on('end', () => resolve(Buffer.concat(chunks)));
      document.on('error', reject);

      document.font(require.resolve('@fontsource/vazirmatn/files/vazirmatn-arabic-400-normal.woff'));
      document.fontSize(11).text(text, {
        align: 'right',
        features: ['rtla'],
        lineGap: 5,
      });
      document.end();
    });
  }
}
