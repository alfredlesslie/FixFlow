"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
let LocationsService = class LocationsService {
    constructor(prisma, auditService) {
        this.prisma = prisma;
        this.auditService = auditService;
    }
    async findAll() {
        return this.prisma.location.findMany({
            orderBy: [{ building: 'asc' }, { code: 'asc' }],
        });
    }
    async findById(id) {
        const location = await this.prisma.location.findUnique({
            where: { id },
        });
        if (!location) {
            throw new common_1.NotFoundException(`Location with ID ${id} not found`);
        }
        return location;
    }
    async findByCode(code) {
        return this.prisma.location.findUnique({
            where: { code },
        });
    }
    async createLocation(input, actorId) {
        const normalizedCode = input.code.toUpperCase().trim();
        const existing = await this.findByCode(normalizedCode);
        if (existing) {
            throw new common_1.ConflictException(`Location with code "${normalizedCode}" already exists`);
        }
        const location = await this.prisma.location.create({
            data: {
                code: normalizedCode,
                name: input.name.trim(),
                building: input.building.trim(),
                floor: input.floor.trim(),
                roomNumber: input.roomNumber ? input.roomNumber.trim() : null,
                description: input.description ? input.description.trim() : null,
            },
        });
        await this.auditService.logAction(actorId || null, 'LOCATION_CREATED', 'LOCATION', location.id, {
            code: location.code,
            name: location.name,
        });
        return location;
    }
    async updateLocation(id, input, actorId) {
        await this.findById(id);
        const updated = await this.prisma.location.update({
            where: { id },
            data: {
                name: input.name !== undefined ? input.name.trim() : undefined,
                building: input.building !== undefined ? input.building.trim() : undefined,
                floor: input.floor !== undefined ? input.floor.trim() : undefined,
                roomNumber: input.roomNumber !== undefined ? input.roomNumber.trim() : undefined,
                description: input.description !== undefined ? input.description.trim() : undefined,
            },
        });
        await this.auditService.logAction(actorId || null, 'LOCATION_UPDATED', 'LOCATION', updated.id, {
            code: updated.code,
        });
        return updated;
    }
};
exports.LocationsService = LocationsService;
exports.LocationsService = LocationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], LocationsService);
//# sourceMappingURL=locations.service.js.map