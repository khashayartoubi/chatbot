import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { KeycloakAuthGuard } from '../auth/guards/keycloak-auth.guard';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { swaggerMessage } from '../common/i18n/swagger-message';
import { WorkbookService } from './workbook.service';

@ApiTags('Excel Assistant')
@ApiBearerAuth('bearerAuth')
@UseGuards(KeycloakAuthGuard)
@Controller('excel-assistant/analyses')
export class WorkbookAnalysesController {
  constructor(private readonly workbookService: WorkbookService) {}

  @Get(':analysisId')
  @ApiOperation({ summary: swaggerMessage('swagger.workbook.getAnalysis') })
  @ApiOkResponse({ description: swaggerMessage('swagger.workbook.analysisReceived') })
  async findOne(@Param('analysisId') analysisId: string, @Req() request: AuthenticatedRequest) {
    const value = request.userInfo['organizationId'] ?? request.userInfo['organization_id'];
    const organizationId = typeof value === 'string' && value ? value : 'demo';
    return this.workbookService.getAnalysis(analysisId, request.userName, organizationId);
  }
}
