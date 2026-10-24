import { BadRequestException, Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { KeycloakAuthGuard } from '../auth/guards/keycloak-auth.guard';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { I18nMessageService } from '../common/i18n/i18n-message.service';
import { swaggerMessage } from '../common/i18n/swagger-message';
import { EditSessionDto } from '../stream/dto/edit-session.dto';
import { UpdateProjectUserMessageDto } from '../stream/dto/update-user-message.dto';
import { StreamService } from '../stream/stream.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectsService } from './projects.service';

@ApiBearerAuth('bearerAuth')
@UseGuards(KeycloakAuthGuard)
@ApiTags('Projects')
@Controller('collection')
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly streamService: StreamService,
    private readonly messages: I18nMessageService
  ) {}

  @Post('create-collection')
  @ApiOperation({ summary: swaggerMessage('swagger.project.create') })
  @ApiBody({ type: CreateProjectDto })
  @ApiCreatedResponse({ description: swaggerMessage('project.created') })
  async create(@Body() dto: CreateProjectDto, @Req() request: AuthenticatedRequest) {
    const project = await this.projectsService.create(dto, request.userName);
    return {
      success: true,
      status: HttpStatus.CREATED,
      message: this.messages.translate('project.created'),
      data: {
        collectionId: project.collectionId,
        collectionName: project.name,
        collectionGraph: {},
        collectionHistory: [],
        createdAt: project.createdAt,
        prompt: '',
        state: 'done',
        waiting: false,
      },
    };
  }

  @Get()
  @ApiOperation({ summary: swaggerMessage('swagger.project.list') })
  @ApiOkResponse({ description: swaggerMessage('project.listReceived') })
  async findAll(@Query() pagination: PaginationQueryDto, @Req() request: AuthenticatedRequest) {
    const projects = await this.projectsService.findAll(request.userName, pagination);
    return {
      success: true,
      status: HttpStatus.OK,
      message: this.messages.translate('project.listReceived'),
      data: projects,
    };
  }

  @Get('get-collection')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: swaggerMessage('swagger.project.details') })
  @ApiOkResponse({ description: swaggerMessage('project.listReceived') })
  async getCollection(@Query() pagination: PaginationQueryDto, @Req() request: AuthenticatedRequest) {
    const projects = await this.projectsService.getProjects(request.userName, pagination);
    return {
      success: true,
      status: HttpStatus.OK,
      message: this.messages.translate('project.received'),
      data: projects,
    };
  }

  @Get(':collectionId/get-messages/:historyId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: swaggerMessage('swagger.project.messages') })
  @ApiOkResponse({ description: swaggerMessage('conversation.messagesReceived') })
  async getMessages(
    @Param('collectionId') collectionId: string,
    @Param('historyId') historyId: string,
    @Query() pagination: PaginationQueryDto,
    @Req() request: AuthenticatedRequest
  ) {
    const messages = await this.projectsService.getMessages(request.userName, collectionId, historyId, pagination);
    return {
      success: true,
      status: HttpStatus.OK,
      message: this.messages.translate('conversation.messagesReceived'),
      data: messages,
    };
  }

  @Patch('edit-collection')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: swaggerMessage('swagger.project.rename') })
  @ApiBody({ type: UpdateProjectDto })
  @ApiOkResponse({ description: swaggerMessage('project.renamed') })
  async updateName(@Body() dto: UpdateProjectDto, @Req() request: AuthenticatedRequest) {
    const project = await this.projectsService.updateName(dto.collectionId, dto, request.userName);
    return {
      success: true,
      status: HttpStatus.OK,
      message: this.messages.translate('project.renamed'),
      data: {
        collectionId: project.collectionId,
        collectionName: project.name,
      },
    };
  }

  @Patch('edit-session')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: swaggerMessage('swagger.project.editConversation') })
  @ApiBody({ type: EditSessionDto })
  @ApiOkResponse({ description: swaggerMessage('conversation.updated') })
  async editSession(@Body() dto: EditSessionDto, @Req() request: AuthenticatedRequest) {
    if (!dto.collectionId) {
      throw new BadRequestException(this.messages.translate('project.idRequired'));
    }
    const session = await this.streamService.editSession(dto, request.userName);
    return {
      success: true,
      status: HttpStatus.OK,
      message: this.messages.translate('conversation.updated'),
      data: session,
    };
  }

  @Patch('update-message')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: swaggerMessage('swagger.project.updateMessage') })
  @ApiBody({ type: UpdateProjectUserMessageDto })
  @ApiOkResponse({ description: swaggerMessage('conversation.messageUpdated') })
  async updateMessage(@Body() dto: UpdateProjectUserMessageDto, @Req() request: AuthenticatedRequest) {
    await this.streamService.updateUserMessage(dto, request.userName, dto.collectionId);
    return {
      success: true,
      status: HttpStatus.OK,
      message: this.messages.translate('conversation.messageUpdated'),
      data: {
        collectionId: dto.collectionId,
        historyId: dto.historyId,
        messageId: dto.messageId,
      },
    };
  }

  @Delete(':collectionId/history/:historyId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: swaggerMessage('swagger.project.deleteConversation') })
  @ApiOkResponse({ description: swaggerMessage('conversation.projectDeleted') })
  async removeHistory(@Param('collectionId') collectionId: string, @Param('historyId') historyId: string, @Req() request: AuthenticatedRequest) {
    await this.streamService.remove(historyId, request.userName, collectionId);
    return {
      success: true,
      status: HttpStatus.OK,
      message: this.messages.translate('conversation.projectDeleted'),
      data: [],
    };
  }

  @Delete(':collectionId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: swaggerMessage('swagger.project.delete') })
  @ApiOkResponse({ description: swaggerMessage('project.deleted') })
  async remove(@Param('collectionId') collectionId: string, @Req() request: AuthenticatedRequest) {
    await this.projectsService.remove(collectionId, request.userName);
    return {
      success: true,
      status: HttpStatus.OK,
      message: this.messages.translate('project.deleted'),
      data: [],
    };
  }
}
