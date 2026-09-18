import { UsersService } from './users.service';
import { User } from './models/user.model';
import { Role } from '../common/enums';
export declare class UsersResolver {
    private readonly usersService;
    constructor(usersService: UsersService);
    getUsers(role?: Role): Promise<User[]>;
    getUser(id: string): Promise<User>;
}
