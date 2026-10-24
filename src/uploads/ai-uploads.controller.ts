import { Body, Controller, Headers, HttpCode, HttpStatus, Post, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBody, ApiHeader, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { I18nMessageService } from '../common/i18n/i18n-message.service';
import { swaggerMessage } from '../common/i18n/swagger-message';
import { RegisterAiFileDto } from './dto/register-ai-file.dto';
import { UploadsService } from './uploads.service';

@ApiTags('Uploads')
@Controller('uploads')
export class AiUploadsController {
  constructor(
    private readonly uploadsService: UploadsService,
    private readonly configService: ConfigService,
    private readonly messages: I18nMessageService
  ) {}

  @Post('ai-file')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: swaggerMessage('swagger.upload.aiRegister') })
  @ApiHeader({ name: 'x-ai-api-key', required: true })
  @ApiBody({ type: RegisterAiFileDto })
  @ApiOkResponse({ description: swaggerMessage('upload.aiRegistered') })
  async register(@Headers('x-ai-api-key') apiKey: string | undefined, @Body() dto: RegisterAiFileDto) {
    const expectedApiKey = this.configService.get<string>('AI_CALLBACK_API_KEY');
    if (!expectedApiKey || apiKey !== expectedApiKey) {
      throw new UnauthorizedException(this.messages.translate('auth.invalidAiKey'));
    }

    const file = await this.uploadsService.registerAiFile(dto);
    return {
      success: true,
      status: HttpStatus.OK,
      message: this.messages.translate('upload.aiRegistered'),
      data: [
        {
          fileId: file.fileId,
          filename: file.filename,
          originalName: file.originalName,
          mimeType: file.mimeType,
          size: Number(file.size),
          bucket: file.bucket,
          objectName: file.objectName,
          fullPath: file.fullPath,
          tag: file.tag,
          sourceFileId: file.sourceFileId,
        },
      ],
    };
  }
}
