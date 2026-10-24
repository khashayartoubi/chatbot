import { Controller, Get, HttpStatus, Param, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { KeycloakAuthGuard } from '../auth/guards/keycloak-auth.guard';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { I18nMessageService } from '../common/i18n/i18n-message.service';
import { swaggerMessage } from '../common/i18n/swagger-message';
import { UploadsService } from './uploads.service';

@UseGuards(KeycloakAuthGuard)
@ApiTags('Uploads')
@ApiBearerAuth('bearerAuth')
@Controller('collection/:collectionId/files')
export class ProjectFilesController {
  constructor(
    private readonly uploadsService: UploadsService,
    private readonly messages: I18nMessageService
  ) {}

  @Get()
  @ApiOperation({ summary: swaggerMessage('swagger.upload.projectFiles') })
  @ApiOkResponse({ description: swaggerMessage('upload.projectFilesReceived') })
  async findAll(@Param('collectionId') collectionId: string, @Req() request: AuthenticatedRequest) {
    const files = await this.uploadsService.findAll(request.userName, collectionId);
    return {
      success: true,
      status: HttpStatus.OK,
      message: this.messages.translate('upload.projectFilesReceived'),
      data: files,
    };
  }
}
