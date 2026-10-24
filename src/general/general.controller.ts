import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { KeycloakAuthGuard } from '../auth/guards/keycloak-auth.guard';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { I18nMessageService } from '../common/i18n/i18n-message.service';
import { swaggerMessage } from '../common/i18n/swagger-message';
import { UpdateUserMessageDto } from '../stream/dto/update-user-message.dto';
import { EditGeneralSessionDto } from './dto/edit-general-session.dto';
import { GeneralService } from './general.service';

@ApiTags('General')
@ApiBearerAuth('bearerAuth')
@UseGuards(KeycloakAuthGuard)
@Controller('general')
export class GeneralController {
  constructor(
    private readonly generalService: GeneralService,
    private readonly messages: I18nMessageService
  ) {}

  @Get('get-history')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: swaggerMessage('swagger.general.list') })
  @ApiOkResponse({ description: swaggerMessage('conversation.historyReceived') })
  async getHistory(@Query() pagination: PaginationQueryDto, @Req() request: AuthenticatedRequest) {
    const histories = await this.generalService.getHistories(request.userName, pagination);
    return {
      success: true,
      status: HttpStatus.OK,
      message: this.messages.translate('conversation.historyReceived'),
      data: histories,
    };
  }

  @Get('get-messages/:historyId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: swaggerMessage('swagger.general.messages') })
  @ApiOkResponse({ description: swaggerMessage('conversation.messagesReceived') })
  async getMessages(@Param('historyId') historyId: string, @Query() pagination: PaginationQueryDto, @Req() request: AuthenticatedRequest) {
    const messages = await this.generalService.getMessages(request.userName, historyId, pagination);
    return {
      success: true,
      status: HttpStatus.OK,
      message: this.messages.translate('conversation.messagesReceived'),
      data: messages,
    };
  }

  @Get(':historyId/files')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: swaggerMessage('swagger.general.files') })
  @ApiOkResponse({ description: swaggerMessage('upload.historyFilesReceived') })
  async getHistoryFiles(@Param('historyId') historyId: string, @Req() request: AuthenticatedRequest) {
    const files = await this.generalService.getHistoryFiles(request.userName, historyId);
    return {
      success: true,
      status: HttpStatus.OK,
      message: this.messages.translate('upload.historyFilesReceived'),
      data: files,
    };
  }

  @Patch('edit-session')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: swaggerMessage('swagger.general.edit') })
  @ApiBody({ type: EditGeneralSessionDto })
  @ApiOkResponse({ description: swaggerMessage('conversation.updated') })
  async editSession(@Body() dto: EditGeneralSessionDto, @Req() request: AuthenticatedRequest) {
    const session = await this.generalService.editSession(dto, request.userName);
    return {
      success: true,
      status: HttpStatus.OK,
      message: this.messages.translate('conversation.updated'),
      data: session,
    };
  }

  @Patch('update-message')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: swaggerMessage('swagger.general.updateMessage') })
  @ApiBody({ type: UpdateUserMessageDto })
  @ApiOkResponse({ description: swaggerMessage('conversation.messageUpdated') })
  async updateMessage(@Body() dto: UpdateUserMessageDto, @Req() request: AuthenticatedRequest) {
    await this.generalService.updateMessage(dto, request.userName);
    return {
      success: true,
      status: HttpStatus.OK,
      message: this.messages.translate('conversation.messageUpdated'),
      data: {
        historyId: dto.historyId,
        messageId: dto.messageId,
      },
    };
  }

  @Delete('delete-history/:historyId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: swaggerMessage('swagger.general.delete') })
  @ApiOkResponse({ description: swaggerMessage('conversation.generalDeleted') })
  async remove(@Param('historyId') historyId: string, @Req() request: AuthenticatedRequest) {
    await this.generalService.remove(historyId, request.userName);
    return {
      success: true,
      status: HttpStatus.OK,
      message: this.messages.translate('conversation.generalDeleted'),
      data: [],
    };
  }

  @Delete('delete-history')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: swaggerMessage('swagger.general.deleteAll') })
  @ApiOkResponse({ description: swaggerMessage('conversation.allGeneralDeleted') })
  async removeAll(@Req() request: AuthenticatedRequest) {
    const deletedCount = await this.generalService.removeAll(request.userName);
    return {
      success: true,
      status: HttpStatus.OK,
      message: this.messages.translate('conversation.allGeneralDeleted'),
      data: { deletedCount },
    };
  }
}
