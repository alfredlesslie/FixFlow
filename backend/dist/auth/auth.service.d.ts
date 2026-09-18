import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { AuditService } from '../audit/audit.service';
import { LoginInput } from './dto/login.input';
import { AuthPayload } from './dto/auth-payload.type';
import { User } from '../users/models/user.model';
export declare class AuthService {
    private readonly usersService;
    private readonly jwtService;
    private readonly auditService;
    constructor(usersService: UsersService, jwtService: JwtService, auditService: AuditService);
    validateUser(email: string, pass: string): Promise<User>;
    login(input: LoginInput): Promise<AuthPayload>;
}
