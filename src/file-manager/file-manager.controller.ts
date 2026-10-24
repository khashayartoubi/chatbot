import { BadRequestException, Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query, Req, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { KeycloakAuthGuard } from '../auth/guards/keycloak-auth.guard';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { I18nMessageService } from '../common/i18n/i18n-message.service';
import { swaggerMessage } from '../common/i18n/swagger-message';
import { uploadOptions } from '../uploads/config/upload.config';
import { FileManagerListQueryDto } from './dto/file-manager-list-query.dto';
import { ImportFilesDto } from './dto/import-files.dto';
import { UploadFileManagerFilesDto } from './dto/upload-file-manager-files.dto';
import { FileManagerService } from './file-manager.service';

@ApiTags('File Manager')
@ApiBearerAuth('bearerAuth')
@UseGuards(KeycloakAuthGuard)
@Controller('fileManager')
export class FileManagerController {
  constructor(
    private readonly fileManagerService: FileManagerService,
    private readonly messages: I18nMessageService
  ) {}

  @Get('recent')
  @ApiOperation({ summary: swaggerMessage('swagger.fileManager.recent') })
  @ApiOkResponse({ description: swaggerMessage('fileManager.filesReceived') })
  async getRecent(@Query() query: FileManagerListQueryDto, @Req() request: AuthenticatedRequest) {
    return this.response(HttpStatus.OK, 'fileManager.filesReceived', await this.fileManagerService.getRecent(query, request.token));
  }

  @Post('storage')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: swaggerMessage('swagger.fileManager.storage') })
  @ApiOkResponse({ description: swaggerMessage('fileManager.storageReceived') })
  async getStorage(@Req() request: AuthenticatedRequest) {
    return this.response(HttpStatus.OK, 'fileManager.storageReceived', await this.fileManagerService.getStorage(request.token));
  }

  @Post('files')
  @ApiOperation({ summary: swaggerMessage('swagger.fileManager.upload') })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['files', 'folderId'],
      properties: {
        files: { type: 'array', items: { type: 'string', format: 'binary' } },
        folderId: { type: 'string' },
      },
    },
  })
  @ApiCreatedResponse({ description: swaggerMessage('fileManager.filesUploaded') })
  @UseInterceptors(FilesInterceptor('files', 10, uploadOptions))
  async upload(@UploadedFiles() files: Express.Multer.File[], @Body() dto: UploadFileManagerFilesDto, @Req() request: AuthenticatedRequest) {
    if (!files?.length) {
      throw new BadRequestException(this.messages.translate('upload.selectFile'));
    }
    return this.response(HttpStatus.CREATED, 'fileManager.filesUploaded', await this.fileManagerService.upload(files, dto.folderId, request.token));
  }

  @Post('files/download/:collectionId')
  @ApiOperation({ summary: swaggerMessage('swagger.fileManager.import') })
  @ApiBody({ type: ImportFilesDto })
  @ApiCreatedResponse({ description: swaggerMessage('fileManager.filesQueued') })
  async import(@Param('collectionId') collectionId: string, @Body() dto: ImportFilesDto, @Req() request: AuthenticatedRequest) {
    return this.response(HttpStatus.CREATED, 'fileManager.filesQueued', await this.fileManagerService.import(dto.fileIds, collectionId, request.userName, request.token));
  }

  private response(status: HttpStatus, messageKey: string, data: unknown) {
    return {
      success: true,
      status,
      message: this.messages.translate(messageKey),
      data,
    };
  }
}
