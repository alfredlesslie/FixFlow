import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { AuditService } from '../audit/audit.service';
import { LoginInput } from './dto/login.input';
import { AuthPayload } from './dto/auth-payload.type';
import { User } from '../users/models/user.model';

import { Role, AccountStatus } from '../common/enums';

// Precomputed dummy bcrypt hash (cost factor 10) to equalize execution timing when user is not found
const DUMMY_BCRYPT_HASH = '$2a$10$wN9a8hV9Q8K9z8q8V8K8w.3Z3x3y3z3a3b3c3d3e3f3g3h3i3j3k3';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly auditService: AuditService,
  ) {}

  async validateUser(email: string, pass: string): Promise<User> {
    const rawUser = await this.usersService.findByEmail(email.toLowerCase().trim());
    if (!rawUser) {
      // Equalize timing to mitigate account enumeration via timing discrepancy
      await bcrypt.compare(pass, DUMMY_BCRYPT_HASH);
      throw new UnauthorizedException('Invalid email or password credentials');
    }

    const isMatch = await bcrypt.compare(pass, rawUser.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password credentials');
    }

    if (!rawUser.isActive) {
      // Record failed login on deactivated account in security audit trail
      await this.auditService.logAction(rawUser.id, 'USER_LOGIN_FAILED_DEACTIVATED', 'USER', rawUser.id, {
        email: rawUser.email,
      });
      // Uniform generic error to prevent account enumeration
      throw new UnauthorizedException('Invalid email or password credentials');
    }

    // Account lifecycle status guards
    if (rawUser.status === AccountStatus.PENDING_VERIFICATION) {
      await this.auditService.logAction(rawUser.id, 'USER_LOGIN_BLOCKED_UNVERIFIED', 'USER', rawUser.id, {
        email: rawUser.email,
      });
      throw new UnauthorizedException('Please verify your institutional email address before logging in');
    }

    if (rawUser.status === AccountStatus.PENDING_APPROVAL) {
      await this.auditService.logAction(rawUser.id, 'USER_LOGIN_BLOCKED_PENDING_APPROVAL', 'USER', rawUser.id, {
        email: rawUser.email,
      });
      throw new UnauthorizedException('Your registration application is pending administrator review');
    }

    if (rawUser.status === AccountStatus.REJECTED) {
      await this.auditService.logAction(rawUser.id, 'USER_LOGIN_REJECTED_ACCOUNT', 'USER', rawUser.id, {
        email: rawUser.email,
        status: AccountStatus.REJECTED,
      });
      // Permitted to authenticate into a restricted session for reapplication and status inspection
    }

    if (rawUser.status === AccountStatus.SUSPENDED) {
      await this.auditService.logAction(rawUser.id, 'USER_LOGIN_BLOCKED_SUSPENDED', 'USER', rawUser.id, {
        email: rawUser.email,
      });
      throw new UnauthorizedException('Account has been suspended. Please contact institutional administration.');
    }

    if (rawUser.status && rawUser.status !== AccountStatus.ACTIVE && rawUser.status !== AccountStatus.REJECTED) {
      throw new UnauthorizedException('Account is not currently active');
    }

    const user = await this.usersService.findById(rawUser.id);
    return user;
  }

  async login(input: LoginInput): Promise<AuthPayload> {
    const user = await this.validateUser(input.email, input.password);

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion ?? 0,
    };

    const accessToken = this.jwtService.sign(payload);

    // Audit log
    await this.auditService.logAction(user.id, 'USER_LOGIN', 'USER', user.id, {
      email: user.email,
      role: user.role,
    });

    return {
      accessToken,
      user,
    };
  }
}
