import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserSettings } from '../settings/entities/user-settings.entity';
import { KeycloakAuthGuard } from './guards/keycloak-auth.guard';
import { ActiveSessionService } from './services/active-session.service';
import { UserManagementService } from './services/user-management.service';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([UserSettings])],
  providers: [UserManagementService, ActiveSessionService, KeycloakAuthGuard],
  exports: [TypeOrmModule, UserManagementService, ActiveSessionService, KeycloakAuthGuard],
})
export class AuthModule {}
