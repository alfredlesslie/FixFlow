import { PrismaService } from '../prisma/prisma.service';
import { Role } from '../common/enums';
import { User } from './models/user.model';
export declare class UsersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private mapUser;
    findById(id: string): Promise<User | null>;
    findByEmail(email: string): Promise<any>;
    findAll(role?: Role): Promise<User[]>;
    updateUserRole(id: string, role: Role): Promise<User>;
}
