import { HealthCheckPayload } from './health.model';
import { PrismaService } from '../prisma/prisma.service';
export declare class HealthResolver {
    private readonly prisma;
    constructor(prisma: PrismaService);
    healthCheck(): Promise<HealthCheckPayload>;
}
