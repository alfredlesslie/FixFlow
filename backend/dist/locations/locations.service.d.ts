import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { Location } from './models/location.model';
import { CreateLocationInput } from './dto/create-location.input';
import { UpdateLocationInput } from './dto/update-location.input';
export declare class LocationsService {
    private readonly prisma;
    private readonly auditService;
    constructor(prisma: PrismaService, auditService: AuditService);
    findAll(): Promise<Location[]>;
    findById(id: string): Promise<Location>;
    findByCode(code: string): Promise<Location | null>;
    createLocation(input: CreateLocationInput, actorId?: string): Promise<Location>;
    updateLocation(id: string, input: UpdateLocationInput, actorId?: string): Promise<Location>;
}
