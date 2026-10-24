import { Body, Controller, HttpCode, HttpStatus, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { KeycloakAuthGuard } from '../auth/guards/keycloak-auth.guard';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { swaggerMessage } from '../common/i18n/swagger-message';
import { ExportSessionDto } from './dto/export-session.dto';
import { ExportService } from './export.service';

@ApiTags('Export')
@ApiBearerAuth('bearerAuth')
@UseGuards(KeycloakAuthGuard)
@Controller('export-session')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: swaggerMessage('swagger.export') })
  @ApiBody({ type: ExportSessionDto })
  @ApiOkResponse({
    description: swaggerMessage('swagger.exportFile'),
    content: {
      'text/plain': { schema: { type: 'string', format: 'binary' } },
      'application/pdf': { schema: { type: 'string', format: 'binary' } },
    },
  })
  async exportSession(@Body() dto: ExportSessionDto, @Req() request: AuthenticatedRequest, @Res() response: Response): Promise<void> {
    const file = await this.exportService.export(dto, request.userName);

    response
      .status(HttpStatus.OK)
      .set({
        'Content-Type': file.mimeType,
        'Content-Disposition': `attachment; filename="${file.filename}"`,
        'Content-Length': file.content.length.toString(),
      })
      .send(file.content);
  }
}
