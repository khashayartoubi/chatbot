import { Controller, Get, HttpStatus, ServiceUnavailableException } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import { I18nMessageService } from '../common/i18n/i18n-message.service';
import { swaggerMessage } from '../common/i18n/swagger-message';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly messages: I18nMessageService,
    private readonly dataSource: DataSource
  ) {}

  @Get()
  @ApiOperation({ summary: swaggerMessage('swagger.health') })
  @ApiOkResponse({ description: swaggerMessage('common.serviceRunning') })
  async check() {
    try {
      await this.dataSource.query('SELECT 1');
    } catch {
      throw new ServiceUnavailableException(this.messages.translate('common.databaseUnavailable'));
    }

    return {
      success: true,
      status: HttpStatus.OK,
      message: this.messages.translate('common.serviceRunning'),
      data: [],
    };
  }
}
