import { BadRequestException, Body, Controller, Get, Headers, HttpCode, HttpStatus, Param, Post, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { KeycloakAuthGuard } from '../auth/guards/keycloak-auth.guard';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { I18nMessageService } from '../common/i18n/i18n-message.service';
import { swaggerMessage } from '../common/i18n/swagger-message';
import { uploadOptions } from '../uploads/config/upload.config';
import { WorkbookService } from './workbook.service';
import { CreateAnalysisDto } from './dto/create-analysis.dto';

@ApiTags('Excel Assistant')
@ApiBearerAuth('bearerAuth')
@UseGuards(KeycloakAuthGuard)
@Controller('excel-assistant/workbooks')
export class WorkbookController {
  constructor(
    private readonly workbookService: WorkbookService,
    private readonly messages: I18nMessageService
  ) {}

  @Post()
  @ApiOperation({ summary: swaggerMessage('swagger.workbook.create') })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiCreatedResponse({ description: swaggerMessage('swagger.workbook.created') })
  @UseInterceptors(FileInterceptor('file', uploadOptions))
  async create(@UploadedFile() file: Express.Multer.File | undefined, @Req() request: AuthenticatedRequest) {
    if (!file) {
      throw new BadRequestException(this.messages.translate('workbook.fileRequired'));
    }
    return this.workbookService.create(file, request.userName, this.organizationId(request));
  }

  @Get(':workbookId')
  @ApiOperation({ summary: swaggerMessage('swagger.workbook.get') })
  @ApiOkResponse({ description: swaggerMessage('swagger.workbook.received') })
  async findOne(@Param('workbookId') workbookId: string, @Req() request: AuthenticatedRequest) {
    return this.workbookService.findOne(workbookId, request.userName, this.organizationId(request));
  }

  @Get(':workbookId/sheets')
  @ApiOperation({ summary: swaggerMessage('swagger.workbook.sheets') })
  @ApiOkResponse({ description: swaggerMessage('swagger.workbook.sheetsReceived') })
  async getSheets(@Param('workbookId') workbookId: string, @Req() request: AuthenticatedRequest) {
    return this.workbookService.getSheets(workbookId, request.userName, this.organizationId(request));
  }

  @Post(':workbookId/analyses')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: swaggerMessage('swagger.workbook.analysis') })
  async createAnalysis(
    @Param('workbookId') workbookId: string,
    @Body() dto: CreateAnalysisDto,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @Req() request: AuthenticatedRequest
  ) {
    return this.workbookService.createAnalysis(workbookId, dto, request.userName, this.organizationId(request), idempotencyKey);
  }

  private organizationId(request: AuthenticatedRequest): string {
    const value = request.userInfo['organizationId'] ?? request.userInfo['organization_id'];
    return typeof value === 'string' && value ? value : 'demo';
  }
}
