import { AuthService } from './auth.service';
import { LoginInput } from './dto/login.input';
import { AuthPayload } from './dto/auth-payload.type';
import { User } from '../users/models/user.model';
export declare class AuthResolver {
    private readonly authService;
    constructor(authService: AuthService);
    login(input: LoginInput): Promise<AuthPayload>;
    getMe(user: User): Promise<User>;
}
