import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { KeycloakAuthGuard } from '../auth/guards/keycloak-auth.guard';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { I18nMessageService } from '../common/i18n/i18n-message.service';
import { swaggerMessage } from '../common/i18n/swagger-message';
import { CreatePromptDto } from './dto/create-prompt.dto';
import { UpdatePromptDto } from './dto/update-prompt.dto';
import { PromptService } from './prompt.service';

@ApiTags('Settings - Prompts')
@ApiBearerAuth('bearerAuth')
@UseGuards(KeycloakAuthGuard)
@Controller('settings/prompts')
export class PromptController {
  constructor(
    private readonly promptService: PromptService,
    private readonly messages: I18nMessageService
  ) {}

  @Post()
  @ApiOperation({ summary: swaggerMessage('swagger.prompt.create') })
  @ApiBody({ type: CreatePromptDto })
  @ApiCreatedResponse({ description: swaggerMessage('prompt.created') })
  async create(@Body() dto: CreatePromptDto, @Req() request: AuthenticatedRequest) {
    const prompt = await this.promptService.create(request.userName, dto);
    return {
      success: true,
      status: HttpStatus.CREATED,
      message: this.messages.translate('prompt.created'),
      data: prompt,
    };
  }

  @Get()
  @ApiOperation({ summary: swaggerMessage('swagger.prompt.list') })
  @ApiOkResponse({ description: swaggerMessage('prompt.listReceived') })
  async findAll(@Req() request: AuthenticatedRequest) {
    const prompts = await this.promptService.findAll(request.userName);
    return {
      success: true,
      status: HttpStatus.OK,
      message: this.messages.translate('prompt.listReceived'),
      data: prompts,
    };
  }

  @Get(':promptId')
  @ApiOperation({ summary: swaggerMessage('swagger.prompt.get') })
  @ApiOkResponse({ description: swaggerMessage('prompt.received') })
  async findOne(@Param('promptId') promptId: string, @Req() request: AuthenticatedRequest) {
    const prompt = await this.promptService.findOne(promptId, request.userName);
    return {
      success: true,
      status: HttpStatus.OK,
      message: this.messages.translate('prompt.received'),
      data: prompt,
    };
  }

  @Patch(':promptId')
  @ApiOperation({ summary: swaggerMessage('swagger.prompt.update') })
  @ApiBody({ type: UpdatePromptDto })
  @ApiOkResponse({ description: swaggerMessage('prompt.updated') })
  async update(@Param('promptId') promptId: string, @Body() dto: UpdatePromptDto, @Req() request: AuthenticatedRequest) {
    const prompt = await this.promptService.update(promptId, request.userName, dto);
    return {
      success: true,
      status: HttpStatus.OK,
      message: this.messages.translate('prompt.updated'),
      data: prompt,
    };
  }

  @Delete(':promptId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: swaggerMessage('swagger.prompt.delete') })
  @ApiOkResponse({ description: swaggerMessage('prompt.deleted') })
  async remove(@Param('promptId') promptId: string, @Req() request: AuthenticatedRequest) {
    await this.promptService.remove(promptId, request.userName);
    return {
      success: true,
      status: HttpStatus.OK,
      message: this.messages.translate('prompt.deleted'),
      data: [],
    };
  }
}
