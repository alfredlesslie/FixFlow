export declare class AuditLog {
    id: string;
    actorId?: string | null;
    action: string;
    entity: string;
    entityId: string;
    metadata?: string | null;
    timestamp: Date;
}
