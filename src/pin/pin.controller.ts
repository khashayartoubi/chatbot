import { Body, Controller, HttpCode, HttpStatus, Patch, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { KeycloakAuthGuard } from '../auth/guards/keycloak-auth.guard';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { I18nMessageService } from '../common/i18n/i18n-message.service';
import { swaggerMessage } from '../common/i18n/swagger-message';
import { PinSessionDto } from './dto/pin-session.dto';
import { PinService } from './pin.service';

@ApiTags('Pin')
@ApiBearerAuth('bearerAuth')
@UseGuards(KeycloakAuthGuard)
@Controller()
export class PinController {
  constructor(
    private readonly pinService: PinService,
    private readonly messages: I18nMessageService
  ) {}

  @Patch('pin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: swaggerMessage('swagger.pin') })
  @ApiBody({ type: PinSessionDto })
  @ApiOkResponse({ description: swaggerMessage('swagger.pinChanged') })
  async pin(@Body() dto: PinSessionDto, @Req() request: AuthenticatedRequest) {
    const result = await this.pinService.toggle(dto, request.userName);
    const messageKey = result.target === 'project' ? (result.pinned ? 'project.pinned' : 'project.unpinned') : result.pinned ? 'conversation.pinned' : 'conversation.unpinned';
    return {
      success: true,
      status: HttpStatus.OK,
      message: this.messages.translate(messageKey),
      data: result,
    };
  }
}
