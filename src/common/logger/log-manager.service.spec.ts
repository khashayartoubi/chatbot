import { LogManager } from './log-manager.service';

describe('LogManager', () => {
  it('formats structured metadata', () => {
    const service = new LogManager();
    const log = jest.spyOn(service, 'log').mockImplementation();

    service.info('TestContext', 'Operation completed', {
      username: 'user',
      count: 2,
    });

    expect(log).toHaveBeenCalledWith('Operation completed | username=user count=2', 'TestContext');
  });
});
