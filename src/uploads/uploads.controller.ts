import { BadRequestException, Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Req, Res, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { KeycloakAuthGuard } from '../auth/guards/keycloak-auth.guard';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { I18nMessageService } from '../common/i18n/i18n-message.service';
import { swaggerMessage } from '../common/i18n/swagger-message';
import { uploadOptions } from './config/upload.config';
import { UploadContextDto } from './dto/upload-context.dto';
import { RenameFileDto } from './dto/rename-file.dto';
import { FileState } from './enums/file-state.enum';
import { UploadsService } from './uploads.service';
import { ApiAcceptedResponse, ApiBearerAuth, ApiBody, ApiConsumes, ApiOkResponse, ApiOperation, ApiProduces, ApiTags } from '@nestjs/swagger';

@ApiTags('Uploads')
@ApiBearerAuth('bearerAuth')
@UseGuards(KeycloakAuthGuard)
@Controller('uploads')
export class UploadsController {
  constructor(
    private readonly uploadsService: UploadsService,
    private readonly messages: I18nMessageService
  ) {}

  @Post()
  @ApiOperation({ summary: swaggerMessage('swagger.upload.multiple') })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['files'],
      oneOf: [{ required: ['files', 'historyId'] }, { required: ['files', 'collectionId'] }],
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
        collectionId: {
          type: 'string',
          description: swaggerMessage('swagger.upload.projectConversationId'),
        },
        historyId: {
          type: 'string',
          description: swaggerMessage('swagger.upload.generalConversationId'),
        },
      },
    },
  })
  @ApiAcceptedResponse({ description: swaggerMessage('upload.queued') })
  @HttpCode(HttpStatus.ACCEPTED)
  @UseInterceptors(FilesInterceptor('files', 10, uploadOptions))
  async upload(@UploadedFiles() files: Express.Multer.File[], @Body() dto: UploadContextDto, @Req() request: AuthenticatedRequest) {
    if (!files?.length) {
      throw new BadRequestException(this.messages.translate('upload.selectFile'));
    }

    if ((!dto.collectionId && !dto.historyId) || (dto.collectionId && dto.historyId)) {
      throw new BadRequestException(this.messages.translate('upload.invalidScope'));
    }

    const data = await this.uploadsService.create(files, request.userName, dto.collectionId, dto.historyId);
    return {
      success: true,
      status: HttpStatus.ACCEPTED,
      message: this.messages.translate('upload.queued'),
      data,
    };
  }

  @Get('files')
  @ApiOperation({ summary: swaggerMessage('swagger.upload.generalFiles') })
  @ApiOkResponse({ description: swaggerMessage('upload.generalFilesReceived') })
  async getGeneralFiles(@Req() request: AuthenticatedRequest) {
    const files = await this.uploadsService.findAll(request.userName);
    return {
      success: true,
      status: HttpStatus.OK,
      message: this.messages.translate('upload.generalFilesReceived'),
      data: files,
    };
  }

  @Get(':fileId')
  @ApiOperation({ summary: swaggerMessage('swagger.upload.status') })
  @ApiOkResponse({ description: swaggerMessage('upload.statusReceived') })
  async getStatus(@Param('fileId') fileId: string, @Req() request: AuthenticatedRequest) {
    const upload = await this.uploadsService.findOne(fileId, request.userName);
    return {
      success: true,
      status: HttpStatus.OK,
      message: this.messages.translate(upload.state === FileState.FAILURE ? 'upload.failed' : 'upload.statusReceived'),
      data: [upload],
    };
  }

  @Patch(':fileId/filename')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: swaggerMessage('swagger.upload.rename') })
  @ApiBody({ type: RenameFileDto })
  @ApiOkResponse({ description: swaggerMessage('upload.renamed') })
  async rename(@Param('fileId') fileId: string, @Body() dto: RenameFileDto, @Req() request: AuthenticatedRequest) {
    const file = await this.uploadsService.rename(fileId, dto.filename, request.userName);
    return {
      success: true,
      status: HttpStatus.OK,
      message: this.messages.translate('upload.renamed'),
      data: file,
    };
  }

  @Delete(':fileId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: swaggerMessage('swagger.upload.delete') })
  @ApiOkResponse({ description: swaggerMessage('upload.deleted') })
  async remove(@Param('fileId') fileId: string, @Req() request: AuthenticatedRequest) {
    await this.uploadsService.remove(fileId, request.userName);
    return {
      success: true,
      status: HttpStatus.OK,
      message: this.messages.translate('upload.deleted'),
      data: { fileId },
    };
  }

  @Get(':fileId/preview')
  @ApiOperation({ summary: swaggerMessage('swagger.upload.preview') })
  @ApiOkResponse({
    description: swaggerMessage('swagger.upload.fileContent'),
    content: {
      'application/octet-stream': {
        schema: { type: 'string', format: 'binary' },
      },
    },
  })
  async preview(@Param('fileId') fileId: string, @Req() request: AuthenticatedRequest, @Res() response: Response) {
    const { upload, stream, size } = await this.uploadsService.preview(fileId, request.userName);
    response.setHeader('Content-Type', upload.mimeType);
    response.setHeader('Content-Length', size);
    response.setHeader('Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(upload.originalName)}`);
    stream.pipe(response);
  }

  @Get(':fileId/download')
  @ApiOperation({ summary: swaggerMessage('swagger.upload.download') })
  @ApiProduces('application/octet-stream')
  @ApiOkResponse({ description: swaggerMessage('upload.downloaded') })
  async download(@Param('fileId') fileId: string, @Req() request: AuthenticatedRequest, @Res() response: Response) {
    const { upload, stream, size } = await this.uploadsService.download(fileId, request.userName);
    response.setHeader('Content-Type', upload.mimeType);
    response.setHeader('Content-Length', size);
    response.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(upload.filename)}`);
    stream.pipe(response);
  }
}
