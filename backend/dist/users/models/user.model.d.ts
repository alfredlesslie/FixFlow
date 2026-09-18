import { Role } from '../../common/enums';
export declare class User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    name: string;
    role: Role;
    department?: string | null;
    phone?: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
