import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { KeycloakAuthGuard } from '../auth/guards/keycloak-auth.guard';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { swaggerMessage } from '../common/i18n/swagger-message';

@ApiTags('Dashboard')
@ApiBearerAuth('bearerAuth')
@Controller('dashboard')
export class DashboardController {
  @Get('get-profile')
  @UseGuards(KeycloakAuthGuard)
  @ApiOperation({ summary: swaggerMessage('swagger.profile') })
  @ApiOkResponse({ description: swaggerMessage('swagger.profile') })
  getProfile(@Req() request: AuthenticatedRequest) {
    return {
      success: true,
      profile: request.userInfo,
    };
  }
}
