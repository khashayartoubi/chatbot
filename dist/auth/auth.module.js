"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const user_settings_entity_1 = require("../settings/entities/user-settings.entity");
const keycloak_auth_guard_1 = require("./guards/keycloak-auth.guard");
const active_session_service_1 = require("./services/active-session.service");
const user_management_service_1 = require("./services/user-management.service");
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Module)({
        imports: [config_1.ConfigModule, typeorm_1.TypeOrmModule.forFeature([user_settings_entity_1.UserSettings])],
        providers: [user_management_service_1.UserManagementService, active_session_service_1.ActiveSessionService, keycloak_auth_guard_1.KeycloakAuthGuard],
        exports: [typeorm_1.TypeOrmModule, user_management_service_1.UserManagementService, active_session_service_1.ActiveSessionService, keycloak_auth_guard_1.KeycloakAuthGuard],
    })
], AuthModule);
//# sourceMappingURL=auth.module.js.map