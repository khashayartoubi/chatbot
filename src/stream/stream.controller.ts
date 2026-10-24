import { Body, Controller, HttpCode, HttpStatus, Post, Req, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiExtraModels, ApiOkResponse, ApiOperation, ApiTags, getSchemaPath } from '@nestjs/swagger';
import { KeycloakAuthGuard } from '../auth/guards/keycloak-auth.guard';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { I18nMessageService } from '../common/i18n/i18n-message.service';
import { swaggerMessage } from '../common/i18n/swagger-message';
import { uploadOptions } from '../uploads/config/upload.config';
import { StreamMessageDto, StreamMultipartDto } from './dto/stream-message.dto';
import { StreamPayloadPipe } from './pipes/stream-payload.pipe';
import { StreamService } from './stream.service';

@UseGuards(KeycloakAuthGuard)
@ApiTags('Stream')
@ApiExtraModels(StreamMessageDto, StreamMultipartDto)
@ApiBearerAuth('bearerAuth')
@Controller('ai-chat-assistant')
export class StreamController {
  constructor(
    private readonly streamService: StreamService,
    private readonly messages: I18nMessageService
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: swaggerMessage('swagger.stream') })
  @ApiConsumes('application/json', 'multipart/form-data')
  @ApiBody({
    schema: { $ref: getSchemaPath(StreamMessageDto) },
  })
  @ApiOkResponse({ description: swaggerMessage('swagger.streamAccepted') })
  @UseInterceptors(FilesInterceptor('files', 10, uploadOptions))
  async stream(@UploadedFiles() files: Express.Multer.File[], @Body(StreamPayloadPipe) payload: unknown, @Req() request: AuthenticatedRequest) {
    const result = await this.streamService.process(payload as StreamMessageDto, request.userName, files ?? []);
    return {
      success: true,
      status: HttpStatus.OK,
      message: this.messages.translate('conversation.processing'),
      data: result,
    };
  }
}
