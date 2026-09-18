import { PrismaService } from '../prisma/prisma.service';
export declare class HealthController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getHealth(): Promise<{
        status: string;
        service: string;
        environment: string;
        uptime: number;
        timestamp: string;
        database: string;
    }>;
}
