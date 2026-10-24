import type { SocketEventsService } from '../socket/services/socket-events.service';
import type { StreamService } from '../stream/stream.service';
import { GeneralService } from './general.service';

describe('GeneralService', () => {
  it('returns histories and emits their updated list', async () => {
    const histories = [{ historyId: 'history-id' }];
    const getHistories = jest.fn().mockResolvedValue(histories);
    const streamService = {
      getHistories,
    } as unknown as StreamService;
    const history = jest.fn();
    const service = new GeneralService(streamService, { history } as unknown as SocketEventsService);

    const result = await service.getHistories('user', { limit: 10, offset: 5 });

    expect(result).toMatchObject(histories);
    expect(getHistories).toHaveBeenCalledWith('user', undefined, { limit: 10, offset: 5 });
    expect(history).toHaveBeenCalledWith('user', histories);
  });

  it('removes all general histories and emits the empty list', async () => {
    const removeAllGeneralHistories = jest.fn().mockResolvedValue(3);
    const getHistories = jest.fn().mockResolvedValue([]);
    const history = jest.fn();
    const service = new GeneralService({ removeAllGeneralHistories, getHistories } as unknown as StreamService, { history } as unknown as SocketEventsService);

    await expect(service.removeAll('user')).resolves.toBe(3);
    expect(removeAllGeneralHistories).toHaveBeenCalledWith('user');
    expect(history).toHaveBeenCalledWith('user', []);
  });
});
