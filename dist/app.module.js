"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const nestjs_i18n_1 = require("nestjs-i18n");
const serve_static_1 = require("@nestjs/serve-static");
const path_1 = require("path");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const auth_module_1 = require("./auth/auth.module");
const common_module_1 = require("./common/common.module");
const background_module_1 = require("./background/background.module");
const dashboard_module_1 = require("./dashboard/dashboard.module");
const export_module_1 = require("./export/export.module");
const general_module_1 = require("./general/general.module");
const projects_module_1 = require("./projects/projects.module");
const model_module_1 = require("./model/model.module");
const settings_module_1 = require("./settings/settings.module");
const health_module_1 = require("./health/health.module");
const file_manager_module_1 = require("./file-manager/file-manager.module");
const transfer_history_module_1 = require("./transfer-history/transfer-history.module");
const pin_module_1 = require("./pin/pin.module");
const prompt_module_1 = require("./prompt/prompt.module");
const workbook_module_1 = require("./workbook/workbook.module");
const error_module_1 = require("./error/error.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            serve_static_1.ServeStaticModule.forRoot({
                rootPath: (0, path_1.join)(__dirname, '..', 'public'),
            }),
            config_1.ConfigModule.forRoot({
                isGlobal: true,
            }),
            nestjs_i18n_1.I18nModule.forRoot({
                fallbackLanguage: 'fa',
                loaderOptions: {
                    path: (0, path_1.join)(__dirname, 'i18n'),
                    watch: true,
                },
                resolvers: [new nestjs_i18n_1.QueryResolver(['lang']), new nestjs_i18n_1.HeaderResolver(['x-lang']), new nestjs_i18n_1.AcceptLanguageResolver({ matchType: 'strict-loose' })],
            }),
            typeorm_1.TypeOrmModule.forRootAsync({
                inject: [config_1.ConfigService],
                useFactory: (config) => ({
                    type: 'postgres',
                    host: config.get('DB_HOST', 'localhost'),
                    port: Number(config.get('DB_PORT', 5432)),
                    username: config.get('DB_USERNAME', 'postgres'),
                    password: config.get('DB_PASSWORD', 'postgres'),
                    database: config.get('DB_NAME', 'dana'),
                    autoLoadEntities: true,
                    synchronize: config.get('DB_SYNCHRONIZE', 'true') === 'true',
                    extra: {
                        max: 10,
                        idleTimeoutMillis: 30000,
                    },
                }),
            }),
            common_module_1.CommonModule,
            error_module_1.ErrorModule,
            auth_module_1.AuthModule,
            dashboard_module_1.DashboardModule,
            export_module_1.ExportModule,
            projects_module_1.ProjectsModule,
            general_module_1.GeneralModule,
            model_module_1.ModelModule,
            settings_module_1.SettingsModule,
            prompt_module_1.PromptModule,
            background_module_1.BackgroundModule,
            health_module_1.HealthModule,
            file_manager_module_1.FileManagerModule,
            transfer_history_module_1.TransferHistoryModule,
            pin_module_1.PinModule,
            workbook_module_1.WorkbookModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map