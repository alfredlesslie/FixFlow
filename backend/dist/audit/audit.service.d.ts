import { PrismaService } from '../prisma/prisma.service';
export declare class AuditService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    logAction(actorId: string | null, action: string, entity: string, entityId: string, metadata?: Record<string, any>): Promise<{
        timestamp: Date;
        id: string;
        action: string;
        entity: string;
        entityId: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        actorId: string | null;
    }>;
}
