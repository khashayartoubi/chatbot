import { Body, Controller, Get, HttpStatus, Patch, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { KeycloakAuthGuard } from '../auth/guards/keycloak-auth.guard';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { I18nMessageService } from '../common/i18n/i18n-message.service';
import { swaggerMessage } from '../common/i18n/swagger-message';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { SettingsService } from './settings.service';

@ApiTags('Settings')
@ApiBearerAuth('bearerAuth')
@UseGuards(KeycloakAuthGuard)
@Controller('settings')
export class SettingsController {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly messages: I18nMessageService
  ) {}

  @Get()
  @ApiOperation({ summary: swaggerMessage('swagger.settings.get') })
  @ApiOkResponse({ description: swaggerMessage('settings.received') })
  async get(@Req() request: AuthenticatedRequest) {
    const settings = await this.settingsService.get(request.userName);
    return {
      success: true,
      status: HttpStatus.OK,
      message: this.messages.translate('settings.received'),
      data: settings,
    };
  }

  @Patch()
  @ApiOperation({ summary: swaggerMessage('swagger.settings.update') })
  @ApiBody({ type: UpdateSettingsDto })
  @ApiOkResponse({ description: swaggerMessage('settings.updated') })
  async update(@Body() dto: UpdateSettingsDto, @Req() request: AuthenticatedRequest) {
    const settings = await this.settingsService.update(request.userName, dto);
    this.messages.setLanguage(settings.defaultLanguage);
    return {
      success: true,
      status: HttpStatus.OK,
      message: this.messages.translate('settings.updated'),
      data: settings,
    };
  }
}
