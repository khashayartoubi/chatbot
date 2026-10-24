import type { LogManager } from '../../common/logger/log-manager.service';
import { ProcessErrorHandler } from './process-error-handler.service';

describe('ProcessErrorHandler', () => {
  const logger = { failure: jest.fn() } as unknown as LogManager;
  const handler = new ProcessErrorHandler(logger);

  afterEach(() => {
    handler.onApplicationShutdown();
    jest.clearAllMocks();
  });

  it('registers and removes process-level error listeners', () => {
    const rejectionListeners = process.listenerCount('unhandledRejection');
    const exceptionListeners = process.listenerCount('uncaughtException');

    handler.onApplicationBootstrap();
    expect(process.listenerCount('unhandledRejection')).toBe(rejectionListeners + 1);
    expect(process.listenerCount('uncaughtException')).toBe(exceptionListeners + 1);

    handler.onApplicationShutdown();
    expect(process.listenerCount('unhandledRejection')).toBe(rejectionListeners);
    expect(process.listenerCount('uncaughtException')).toBe(exceptionListeners);
  });
});
