import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { AuditService } from '../audit/audit.service';
import { LoginInput } from './dto/login.input';
import { AuthPayload } from './dto/auth-payload.type';
import { User } from '../users/models/user.model';

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
      throw new UnauthorizedException('Invalid email or password credentials');
    }

    if (!rawUser.isActive) {
      throw new UnauthorizedException('User account is deactivated. Contact campus administrator');
    }

    const isMatch = await bcrypt.compare(pass, rawUser.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password credentials');
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
