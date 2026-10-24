import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { AuditModule } from './audit/audit.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { LocationsModule } from './locations/locations.module';
import { AssetCategoriesModule } from './asset-categories/asset-categories.module';
import { AssetsModule } from './assets/assets.module';
import { MailModule } from './mail/mail.module';
import { AttachmentsModule } from './attachments/attachments.module';
import { RequestsModule } from './requests/requests.module';
import { WorkOrdersModule } from './work-orders/work-orders.module';
import { CommentsModule } from './comments/comments.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { SchedulesModule } from './schedules/schedules.module';
import { isGraphQLPlaygroundEnabled, isDevOrTestEnvironment } from './common/config/environment.helper';
import { formatGraphQLError } from './common/config/graphql-error.helper';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../.env'],
    }),
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const isPlaygroundAllowed = isGraphQLPlaygroundEnabled(config);
        const isDevOrTest = isDevOrTestEnvironment(config.get<string>('NODE_ENV'));
        return {
          autoSchemaFile: isDevOrTest ? join(process.cwd(), 'src/schema.gql') : true,
          sortSchema: true,
          playground: isPlaygroundAllowed,
          introspection: isPlaygroundAllowed,
          context: ({ req, res }) => ({ req, res }),
          formatError: (formattedError: any) =>
            formatGraphQLError(formattedError, config.get<string>('NODE_ENV')),
        };
      },
    }),
    PrismaModule,
    AuditModule,
    HealthModule,
    UsersModule,
    MailModule,
    AuthModule,
    LocationsModule,
    AssetCategoriesModule,
    AssetsModule,
    AttachmentsModule,
    RequestsModule,
    WorkOrdersModule,
    CommentsModule,
    NotificationsModule,
    AnalyticsModule,
    SchedulesModule,
  ],
})
export class AppModule {}
