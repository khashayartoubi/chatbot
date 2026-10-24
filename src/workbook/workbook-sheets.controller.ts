import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { KeycloakAuthGuard } from '../auth/guards/keycloak-auth.guard';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { swaggerMessage } from '../common/i18n/swagger-message';
import { SheetRowsQueryDto } from './dto/sheet-rows-query.dto';
import { WorkbookService } from './workbook.service';

@ApiTags('Excel Assistant')
@ApiBearerAuth('bearerAuth')
@UseGuards(KeycloakAuthGuard)
@Controller('excel-assistant/sheets')
export class WorkbookSheetsController {
  constructor(private readonly workbookService: WorkbookService) {}

  @Get(':sheetId/rows')
  @ApiOperation({ summary: swaggerMessage('swagger.workbook.rows') })
  @ApiOkResponse({ description: swaggerMessage('swagger.workbook.rowsReceived') })
  async getRows(@Param('sheetId') sheetId: string, @Query() query: SheetRowsQueryDto, @Req() request: AuthenticatedRequest) {
    return this.workbookService.getRows(sheetId, request.userName, this.organizationId(request), query.offset, query.limit);
  }

  private organizationId(request: AuthenticatedRequest): string {
    const value = request.userInfo['organizationId'] ?? request.userInfo['organization_id'];
    return typeof value === 'string' && value ? value : 'demo';
  }
}
