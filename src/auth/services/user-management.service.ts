import { BadGatewayException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { I18nMessageService } from '../../common/i18n/i18n-message.service';
import { LogManager } from '../../common/logger/log-manager.service';
import type { KeycloakUser } from '../interfaces/keycloak-user.interface';
import type { UserInfoResponse } from '../interfaces/user-info-response.interface';

@Injectable()
export class UserManagementService {
  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LogManager,
    private readonly messages: I18nMessageService
  ) {}

  async fetchUserInfo(token: string): Promise<KeycloakUser> {
    const url = this.buildUrl('users/subproject/auth');
    const startedAt = Date.now();
    this.logger.trace(UserManagementService.name, 'User profile request started');

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
          accept: 'application/json',
          'content-type': 'application/json',
        },
        body: JSON.stringify({}),
        signal: AbortSignal.timeout(10_000),
      });
    } catch (error) {
      this.logger.failure(UserManagementService.name, 'User profile service is unavailable', error, {
        durationMs: Date.now() - startedAt,
      });
      throw new BadGatewayException(this.messages.translate('auth.serviceUnavailable'));
    }

    if (response.status === 401 || response.status === 403) {
      this.logger.warning(UserManagementService.name, 'User profile request rejected', {
        status: response.status,
        durationMs: Date.now() - startedAt,
      });
      throw this.unauthorized(this.messages.translate('auth.invalidToken'));
    }

    if (!response.ok) {
      this.logger.warning(UserManagementService.name, 'User profile service returned an invalid status', {
        status: response.status,
        durationMs: Date.now() - startedAt,
      });
      throw new BadGatewayException(this.messages.translate('auth.invalidResponse'));
    }

    const responseText = await response.text();
    if (!responseText.trim()) {
      throw new BadGatewayException(this.messages.translate('auth.emptyResponse'));
    }

    let body: UserInfoResponse | KeycloakUser;
    try {
      body = JSON.parse(responseText) as UserInfoResponse | KeycloakUser;
    } catch {
      throw new BadGatewayException(this.messages.translate('auth.malformedResponse'));
    }
    const user = this.extractUser(body);

    if (!user?.username) {
      throw this.unauthorized(this.messages.translate('auth.userNotFound'));
    }

    this.logger.trace(UserManagementService.name, 'User profile received', {
      username: user.username,
      durationMs: Date.now() - startedAt,
    });
    return user;
  }

  private buildUrl(path: string): string {
    const baseUrl = this.configService.get<string>('KEYCLOAK_SERVER_URL_CHATBOT');

    if (!baseUrl) {
      throw new Error('KEYCLOAK_SERVER_URL_CHATBOT is not configured');
    }

    return new URL(path.replace(/^\/+/, ''), this.ensureTrailingSlash(baseUrl)).toString();
  }

  private ensureTrailingSlash(value: string): string {
    return value.endsWith('/') ? value : `${value}/`;
  }

  private extractUser(body: UserInfoResponse | KeycloakUser): KeycloakUser | undefined {
    if ('username' in body) {
      return body;
    }

    if (body.profile) {
      return body.profile;
    }

    if (!body.data) {
      return undefined;
    }

    return 'username' in body.data ? body.data : body.data.data;
  }

  private unauthorized(message: string): UnauthorizedException {
    return new UnauthorizedException(message);
  }
}
