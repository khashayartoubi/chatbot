import { StreamScope } from '../../stream/enums/stream-scope.enum';
import { SocketEventsService } from './socket-events.service';

describe('SocketEventsService', () => {
  it('emits the history map directly for both assistant message events', () => {
    const service = new SocketEventsService();
    const message = { id: 'message-id', message: 'سلام', bot: false };
    const assistantMessage = jest.fn();
    const assistantHistory = jest.fn();

    service.on('aiAssistantMessage', assistantMessage);
    service.on('aiAssistantMessageHistory', assistantHistory);
    service.start('user', {
      chatId: 'history-id',
      historyId: 'history-id',
      messageId: 'message-id',
      scope: StreamScope.GENERAL,
      messages: [message],
    });

    const expected = {
      'history-id': [message],
    };
    expect(assistantMessage).toHaveBeenLastCalledWith('user', expected);
    expect(assistantHistory).toHaveBeenLastCalledWith('user', expected);
  });

  it('emits fetched conversation messages to both assistant message events', () => {
    const service = new SocketEventsService();
    const assistantMessage = jest.fn();
    const assistantHistory = jest.fn();
    const messages = [{ id: 'message-id', message: 'سلام' }];
    service.on('aiAssistantMessage', assistantMessage);
    service.on('aiAssistantMessageHistory', assistantHistory);

    service.messages('user', 'history-id', messages);

    const expected = { 'history-id': messages };
    expect(assistantMessage).toHaveBeenCalledWith('user', expected);
    expect(assistantHistory).toHaveBeenCalledWith('user', expected);
  });

  it('emits streamed AI messages through aiAssistantMessageHistory', () => {
    const service = new SocketEventsService();
    const assistantHistory = jest.fn();
    const messages = [{ id: 'bot-message', message: 'پاسخ در حال تکمیل', bot: true }];
    service.on('aiAssistantMessageHistory', assistantHistory);

    service.token('user', {
      chatId: 'chat-id',
      historyId: 'history-id',
      messageId: 'bot-message',
      scope: StreamScope.PROJECT,
      token: 'تکمیل',
      message: 'پاسخ در حال تکمیل',
      messages,
    });

    expect(assistantHistory).toHaveBeenCalledWith('user', { 'history-id': messages });
  });

  it('clears aiAssistantMessageHistory after the stream ends', () => {
    const service = new SocketEventsService();
    const assistantHistory = jest.fn();
    service.on('aiAssistantMessageHistory', assistantHistory);

    service.start('user', {
      chatId: 'chat-id',
      historyId: 'history-id',
      messageId: 'bot-message',
      scope: StreamScope.GENERAL,
      messages: [{ id: 'user-message', bot: false, type: 'LOADING' }],
    });
    service.end('user', {
      chatId: 'chat-id',
      historyId: 'history-id',
      messageId: 'bot-message',
      scope: StreamScope.GENERAL,
      message: 'پاسخ کامل',
      messages: [{ id: 'bot-message', bot: true, type: 'text' }],
    });

    expect(assistantHistory).toHaveBeenLastCalledWith('user', {});
  });
});
