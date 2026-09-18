import { PrismaService } from '../prisma/prisma.service';
import { AuditLog } from './models/audit-log.model';
export declare class AuditResolver {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getAuditLogs(entity?: string, limit?: number): Promise<AuditLog[]>;
}
