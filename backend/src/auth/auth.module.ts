import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { getValidatedJwtSecret } from './jwt-config.helper';
import { AuthService } from './auth.service';
import { AuthResolver } from './auth.resolver';
import { JwtStrategy } from './jwt.strategy';
import { VerificationTokenService } from './verification-token.service';
import { RegistrationService } from './registration.service';
import { AdministratorApprovalsService } from './administrator-approvals.service';
import { UsersModule } from '../users/users.module';
import { MailModule } from '../mail/mail.module';
import { RateLimitGuard } from '../common/guards/rate-limit.guard';

@Module({
  imports: [
    UsersModule,
    MailModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: getValidatedJwtSecret(config),
        signOptions: {
          expiresIn: config.get<string>('JWT_EXPIRES_IN') || '7d',
        },
      }),
    }),
  ],
  providers: [
    AuthService,
    AuthResolver,
    JwtStrategy,
    VerificationTokenService,
    RegistrationService,
    AdministratorApprovalsService,
    RateLimitGuard,
  ],
  exports: [
    AuthService,
    RegistrationService,
    AdministratorApprovalsService,
    VerificationTokenService,
  ],
})
export class AuthModule {}
