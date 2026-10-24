import { BadRequestException } from '@nestjs/common';
import type { I18nMessageService } from '../../common/i18n/i18n-message.service';
import { StreamPayloadPipe } from './stream-payload.pipe';
import { SelectionMode } from '../enums/selection-mode.enum';

describe('StreamPayloadPipe', () => {
  const pipe = new StreamPayloadPipe({
    translate: (key: string) => key,
  } as I18nMessageService);
  const message = {
    id: '123',
    type: 'text',
    message: 'سلام',
    attachments: [],
  };

  it('parses the nested multipart JSON payload', async () => {
    const result = await pipe.transform(
      JSON.stringify({
        selectionMode: 'summarizer',
        messageSchema: { message },
      })
    );

    expect(result.messageSchema.message.message).toBe('سلام');
    expect(result.fileIds).toEqual([]);
  });

  it('parses payload wrapped by multipart form data', async () => {
    const result = await pipe.transform({
      payload: JSON.stringify({
        selectionMode: 'ocr',
        messageSchema: { message },
      }),
    });

    expect(result.selectionMode).toBe('ocr');
    expect(result.messageSchema.message.message).toBe('سلام');
  });

  it('accepts the frontend multipart payload schema', async () => {
    const result = await pipe.transform({
      payload: JSON.stringify({
        collectionId: null,
        historyId: null,
        sessionId: '10894872377576',
        fileIds: [],
        letter_operation: 'create',
        messageSchema: {
          message: {
            id: '19479117259861',
            type: 'text',
            message: 'sd',
            text: 'متن اصلی',
            letter_operation: 'rewrite',
            createdAt: '2026-07-28T12:35:41.935Z',
            attachments: [],
            avatar: '',
            comment: '',
            liked: false,
            disLiked: false,
            starred: false,
            bot: false,
            unread: false,
            delivered: true,
            reply: [{ analyse: [], data: [] }],
          },
        },
      }),
    });

    expect(result.collectionId).toBeNull();
    expect(result.sessionId).toBe('10894872377576');
    expect(result.messageSchema.message.message).toBe('sd');
    expect(result.messageSchema.message.text).toBe('متن اصلی');
    expect(result.messageSchema.message.letter_operation).toBe('rewrite');
    expect(result.letter_operation).toBe('create');
  });

  it('normalizes frontend letterOperation to letter_operation', async () => {
    const result = await pipe.transform({
      selectionMode: 'letter',
      letterOperation: 'quality_control',
      messageSchema: { message },
    });

    expect(result.letter_operation).toBe('quality_control');
    expect(result).not.toHaveProperty('letterOperation');
  });

  it('keeps letter_operation when both naming styles are provided', async () => {
    const result = await pipe.transform({
      selectionMode: 'letter',
      letterOperation: 'quality_control',
      letter_operation: 'rewrite',
      messageSchema: { message },
    });

    expect(result.letter_operation).toBe('rewrite');
  });

  it('normalizes a direct messageSchema payload', async () => {
    const result = await pipe.transform({
      selectionMode: 'summarizer',
      messageSchema: message,
    });

    expect(result.messageSchema.message.id).toBe('123');
  });

  it('rejects a payload without a message', async () => {
    await expect(
      pipe.transform({
        selectionMode: 'summarizer',
      })
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('defaults selectionMode to generalChat', async () => {
    const result = await pipe.transform({
      messageSchema: { message },
    });

    expect(result.selectionMode).toBe('generalChat');
  });

  it('rejects an unknown selectionMode', async () => {
    await expect(
      pipe.transform({
        selectionMode: 'unknown',
        messageSchema: { message },
      })
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it.each(Object.values(SelectionMode))('accepts the %s selectionMode', async (selectionMode) => {
    const result = await pipe.transform({
      selectionMode,
      messageSchema: { message },
    });

    expect(result.selectionMode).toBe(selectionMode);
  });
});
