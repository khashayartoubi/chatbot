import { ConfigService } from '@nestjs/config';
import type { I18nMessageService } from '../../common/i18n/i18n-message.service';
import type { LogManager } from '../../common/logger/log-manager.service';
import { UserManagementService } from './user-management.service';

describe('UserManagementService', () => {
  afterEach(() => jest.restoreAllMocks());

  it('returns the authenticated user profile', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ data: { username: 'user' } }), {
        status: 200,
      })
    );
    const service = new UserManagementService(
      new ConfigService({ KEYCLOAK_SERVER_URL_CHATBOT: 'http://keycloak/api/' }),
      { trace: jest.fn() } as unknown as LogManager,
      { translate: (key: string) => key } as I18nMessageService
    );

    await expect(service.fetchUserInfo('token')).resolves.toMatchObject({ username: 'user' });
    expect(fetch).toHaveBeenCalledWith('http://keycloak/api/users/subproject/auth', expect.objectContaining({ method: 'POST' }));
  });
});
