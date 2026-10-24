import { Body, Controller, HttpCode, HttpStatus, Patch, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { KeycloakAuthGuard } from '../auth/guards/keycloak-auth.guard';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { I18nMessageService } from '../common/i18n/i18n-message.service';
import { swaggerMessage } from '../common/i18n/swagger-message';
import { TransferHistoryDto } from './dto/transfer-history.dto';
import type { TransferHistoryResult } from './interfaces/transfer-history-result.interface';
import { TransferHistoryService } from './transfer-history.service';

@ApiTags('Transfer History')
@ApiBearerAuth('bearerAuth')
@UseGuards(KeycloakAuthGuard)
@Controller('transfer')
export class TransferHistoryController {
  constructor(
    private readonly transferHistoryService: TransferHistoryService,
    private readonly messages: I18nMessageService
  ) {}

  @Patch('transfer-history')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: swaggerMessage('swagger.transferHistory') })
  @ApiBody({ type: TransferHistoryDto })
  @ApiOkResponse({ description: swaggerMessage('conversation.movedToProject') })
  async transfer(@Body() dto: TransferHistoryDto, @Req() request: AuthenticatedRequest) {
    const transfer: TransferHistoryResult = await this.transferHistoryService.transfer(dto, request.userName);
    return {
      success: true,
      status: HttpStatus.OK,
      message: this.messages.translate(transfer.target === 'general' ? 'conversation.movedToGeneral' : 'conversation.movedToProject'),
      data: {
        historyId: dto.historyId,
        sourceCollectionId: transfer.sourceCollectionId,
        targetCollectionId: transfer.targetCollectionId,
        target: transfer.target,
      },
    };
  }
}
