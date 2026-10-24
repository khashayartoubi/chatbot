import { BadRequestException, Body, Controller, Get, HttpCode, HttpStatus, Patch, Post, Req, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { unlink } from 'node:fs/promises';
import { KeycloakAuthGuard } from '../auth/guards/keycloak-auth.guard';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { I18nMessageService } from '../common/i18n/i18n-message.service';
import { swaggerMessage } from '../common/i18n/swagger-message';
import { uploadOptions } from '../uploads/config/upload.config';
import { BackgroundService } from './background.service';
import { UpdateBackgroundDto } from './dto/update-background.dto';

@ApiTags('Background')
@ApiBearerAuth('bearerAuth')
@UseGuards(KeycloakAuthGuard)
@Controller('background')
export class BackgroundController {
  constructor(
    private readonly backgroundService: BackgroundService,
    private readonly messages: I18nMessageService
  ) {}

  @Get()
  @ApiOperation({ summary: swaggerMessage('swagger.background.get') })
  @ApiOkResponse({ description: swaggerMessage('background.received') })
  async get(@Req() request: AuthenticatedRequest) {
    const background = await this.backgroundService.get(request.userName);
    return {
      success: true,
      status: HttpStatus.OK,
      message: this.messages.translate('background.received'),
      data: background,
    };
  }

  @Patch()
  @ApiOperation({ summary: swaggerMessage('swagger.background.update') })
  @ApiBody({ type: UpdateBackgroundDto })
  @ApiOkResponse({ description: swaggerMessage('background.updated') })
  async update(@Body() dto: UpdateBackgroundDto, @Req() request: AuthenticatedRequest) {
    const background = await this.backgroundService.update(request.userName, dto);
    return {
      success: true,
      status: HttpStatus.OK,
      message: this.messages.translate('background.updated'),
      data: background,
    };
  }

  @Post('image')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: swaggerMessage('swagger.background.upload') })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['image'],
      properties: {
        image: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiOkResponse({ description: swaggerMessage('background.saved') })
  @UseInterceptors(FileInterceptor('image', uploadOptions))
  async uploadImage(@UploadedFile() file: Express.Multer.File, @Req() request: AuthenticatedRequest) {
    if (!file) {
      throw new BadRequestException(this.messages.translate('background.selectImage'));
    }
    if (!file.mimetype.startsWith('image/')) {
      await unlink(file.path).catch(() => undefined);
      throw new BadRequestException(this.messages.translate('background.invalidImage'));
    }
    const background = await this.backgroundService.uploadImage(request.userName, file);
    return {
      success: true,
      status: HttpStatus.OK,
      message: this.messages.translate('background.saved'),
      data: background,
    };
  }

  @Get('image')
  @ApiOperation({ summary: swaggerMessage('swagger.background.preview') })
  @ApiOkResponse({
    description: swaggerMessage('swagger.background.image'),
    content: {
      'image/*': { schema: { type: 'string', format: 'binary' } },
    },
  })
  async preview(@Req() request: AuthenticatedRequest, @Res() response: Response) {
    const { background, stream, size } = await this.backgroundService.preview(request.userName);
    response.setHeader('Content-Type', background.mimeType!);
    response.setHeader('Content-Length', size);
    stream.pipe(response);
  }
}
