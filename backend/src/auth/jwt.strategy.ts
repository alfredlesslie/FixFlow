import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { getValidatedJwtSecret } from './jwt-config.helper';
import { UsersService } from '../users/users.service';
import { AccountStatus } from '../common/enums';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  tokenVersion: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: getValidatedJwtSecret(configService),
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.usersService.findById(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Session expired or user account is no longer active');
    }

    // Mandatory tokenVersion validation: reject missing, non-numeric, or mismatched claims
    if (typeof payload.tokenVersion !== 'number' || user.tokenVersion !== payload.tokenVersion) {
      throw new UnauthorizedException('Session has been revoked or invalidated; please log in again');
    }

    // Account status check: ACTIVE users are permitted; REJECTED accounts are permitted for restricted reapplication
    if (user.status !== AccountStatus.ACTIVE && user.status !== AccountStatus.REJECTED) {
      throw new UnauthorizedException('User account is not currently in an authorized status');
    }

    return user;
  }
}
