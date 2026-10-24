import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { I18nMessageService } from '../common/i18n/i18n-message.service';
import { swaggerMessage } from '../common/i18n/swagger-message';
import { ModelService } from './model.service';
import { KeycloakAuthGuard } from '../auth/guards/keycloak-auth.guard';
import { SetModelDto } from './dto/set-model.dto';

@ApiTags('Model')
@Controller('model')
@ApiBearerAuth('bearerAuth')
@UseGuards(KeycloakAuthGuard)
export class ModelController {
  constructor(
    private readonly modelService: ModelService,
    private readonly messages: I18nMessageService
  ) {}

  @Get('getModel')
  @ApiOperation({ summary: swaggerMessage('swagger.model') })
  @ApiOkResponse({ description: swaggerMessage('model.received') })
  async getModel() {
    const models = await this.modelService.getModels();

    return {
      success: true,
      status: 200,
      message: this.messages.translate('model.received'),
      data: models,
    };
  }

  @Post('setModel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: swaggerMessage('swagger.setModel') })
  @ApiBody({ type: SetModelDto })
  @ApiOkResponse({ description: swaggerMessage('model.updated') })
  async setModel(@Body() dto: SetModelDto, @Req() request: AuthenticatedRequest) {
    const updatedCount = await this.modelService.setModel(dto, request.userName);
    return {
      success: true,
      status: HttpStatus.OK,
      message: this.messages.translate('model.updated'),
      data: { updatedCount },
    };
  }
}
