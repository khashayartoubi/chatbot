import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import type { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';
import { ActiveSessionService } from '../services/active-session.service';
import { UserManagementService } from '../services/user-management.service';
import { I18nMessageService } from '../../common/i18n/i18n-message.service';
import { LogManager } from '../../common/logger/log-manager.service';
import { UserSettings } from '../../settings/entities/user-settings.entity';

@Injectable()
export class KeycloakAuthGuard implements CanActivate {
  constructor(
    private readonly userManagementService: UserManagementService,
    private readonly activeSessionService: ActiveSessionService,
    private readonly logger: LogManager,
    private readonly messages: I18nMessageService,
    @InjectRepository(UserSettings)
    private readonly settingsRepository: Repository<UserSettings>
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const clientIp = this.getClientIp(request);
    this.logger.trace(KeycloakAuthGuard.name, 'Authentication started', {
      method: request.method,
      path: request.url,
      ip: clientIp,
    });

    const token = this.extractBearerToken(request.headers.authorization);
    const currentUser = await this.userManagementService.fetchUserInfo(token);
    await this.setUserLanguage(currentUser.username);

    request.userName = currentUser.username;
    request.userInfo = currentUser;
    request.token = token;
    this.logger.trace(KeycloakAuthGuard.name, 'Authentication completed', {
      username: currentUser.username,
      method: request.method,
      path: request.url,
    });

    // const activeSession = this.activeSessionService.get(currentUser.username);
    // if (activeSession && activeSession.token !== token) {
    //   this.logger.warn(`Repeated login rejected for ${currentUser.username}; previous IP: ${activeSession.ip ?? 'unknown'}, new IP: ${clientIp}`);

    //   throw new BadRequestException({
    //     success: false,
    //     status: 400,
    //     isAuth: false,
    //     message: 'یک کاربر با این نام کاربری به سامانه وارد شده است',
    //     error_code: 9003,
    //   });
    // }

    return true;
  }

  private extractBearerToken(authorization?: string): string {
    if (!authorization) {
      throw this.unauthorized(this.messages.translate('auth.loginRequired'));
    }

    const [scheme, token, ...rest] = authorization.trim().split(/\s+/);
    if (scheme?.toLowerCase() !== 'bearer' || !token || rest.length > 0) {
      throw this.unauthorized(this.messages.translate('auth.invalidTokenStructure'));
    }

    return token;
  }

  private getClientIp(request: AuthenticatedRequest): string {
    const forwardedFor = request.headers['x-forwarded-for'];
    const forwardedIp = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor?.split(',')[0]?.trim();

    return (forwardedIp || request.ip || request.socket.remoteAddress || '').replace('::ffff:', '');
  }

  private unauthorized(message: string): UnauthorizedException {
    return new UnauthorizedException({
      success: false,
      status: 401,
      isAuth: false,
      message,
    });
  }

  private async setUserLanguage(username: string): Promise<void> {
    try {
      const settings = await this.settingsRepository.findOneBy({ username });
      this.messages.setLanguage(settings?.defaultLanguage ?? 'fa');
    } catch (error) {
      this.messages.setLanguage('fa');
      this.logger.failure(KeycloakAuthGuard.name, 'Could not load user language; using fallback', error, {
        username,
        fallbackLanguage: 'fa',
      });
    }
  }
}
