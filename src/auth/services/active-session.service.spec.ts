import { ActiveSessionService } from './active-session.service';

describe('ActiveSessionService', () => {
  it('registers and removes a user session', () => {
    const service = new ActiveSessionService();

    service.register('user', 'token', '127.0.0.1');
    expect(service.get('user')).toEqual({ token: 'token', ip: '127.0.0.1' });

    service.remove('user');
    expect(service.get('user')).toBeUndefined();
  });
});
