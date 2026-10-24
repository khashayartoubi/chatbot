import type { Repository } from 'typeorm';
import type { I18nMessageService } from '../common/i18n/i18n-message.service';
import type { Project } from '../projects/entities/project.entity';
import { ChatMessage } from '../stream/entities/chat-message.entity';
import { Chat } from '../stream/entities/chat.entity';
import { ChatType } from '../stream/enums/chat-type.enum';
import { ExportFormat } from './enums/export-format.enum';
import { ExportService } from './export.service';

describe('ExportService', () => {
  it('exports a general conversation as UTF-8 text', async () => {
    const chat = Object.assign(new Chat(), {
      id: 'chat-id',
      type: ChatType.GENERAL,
      username: 'user',
      historyId: 'history-id',
      historyName: 'Conversation',
    });
    const messages = [
      Object.assign(new ChatMessage(), {
        bot: false,
        message: 'Hello',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      }),
      Object.assign(new ChatMessage(), {
        bot: true,
        message: 'Hi',
        createdAt: new Date('2026-01-01T00:00:01.000Z'),
      }),
    ];
    const service = new ExportService(
      {
        findOne: jest.fn().mockResolvedValue(chat),
      } as unknown as Repository<Chat>,
      {
        find: jest.fn().mockResolvedValue(messages),
      } as unknown as Repository<ChatMessage>,
      {} as Repository<Project>,
      { translate: (key: string) => key } as I18nMessageService
    );

    const result = await service.export(
      {
        historyId: 'history-id',
        format: ExportFormat.TEXT,
      },
      'user'
    );

    expect(result.filename).toBe('session-history-id.txt');
    expect(result.mimeType).toContain('text/plain');
    expect(result.content.toString('utf8')).toContain('Hello');
  });
});
