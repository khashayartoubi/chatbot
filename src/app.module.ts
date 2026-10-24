import { Module } from '@nestjs/common';
import { AcceptLanguageResolver, HeaderResolver, I18nModule, QueryResolver } from 'nestjs-i18n';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { CommonModule } from './common/common.module';
import { BackgroundModule } from './background/background.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ExportModule } from './export/export.module';
import { GeneralModule } from './general/general.module';
import { ProjectsModule } from './projects/projects.module';
import { ModelModule } from './model/model.module';
import { SettingsModule } from './settings/settings.module';
import { HealthModule } from './health/health.module';
import { FileManagerModule } from './file-manager/file-manager.module';
import { TransferHistoryModule } from './transfer-history/transfer-history.module';
import { PinModule } from './pin/pin.module';
import { PromptModule } from './prompt/prompt.module';
import { WorkbookModule } from './workbook/workbook.module';
import { ErrorModule } from './error/error.module';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    I18nModule.forRoot({
      fallbackLanguage: 'fa',
      loaderOptions: {
        path: join(__dirname, 'i18n'),
        watch: true,
      },
      resolvers: [new QueryResolver(['lang']), new HeaderResolver(['x-lang']), new AcceptLanguageResolver({ matchType: 'strict-loose' })],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'localhost'),
        port: Number(config.get('DB_PORT', 5432)),
        username: config.get('DB_USERNAME', 'postgres'),
        password: config.get('DB_PASSWORD', 'postgres'),
        database: config.get('DB_NAME', 'dana'),
        autoLoadEntities: true,
        synchronize: config.get<string>('DB_SYNCHRONIZE', 'true') === 'true',
        extra: {
          max: 10,
          idleTimeoutMillis: 30000,
        },
      }),
    }),
    CommonModule,
    ErrorModule,
    AuthModule,
    DashboardModule,
    ExportModule,
    ProjectsModule,
    GeneralModule,
    ModelModule,
    SettingsModule,
    PromptModule,
    BackgroundModule,
    HealthModule,
    FileManagerModule,
    TransferHistoryModule,
    PinModule,
    WorkbookModule,
  ],
})
export class AppModule {}
