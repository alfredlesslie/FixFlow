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
exports.AssetsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const enums_1 = require("../common/enums");
let AssetsService = class AssetsService {
    constructor(prisma, auditService) {
        this.prisma = prisma;
        this.auditService = auditService;
    }
    async findAll(filter) {
        const where = {};
        if (filter?.search) {
            const q = filter.search.trim();
            where.OR = [
                { name: { contains: q, mode: 'insensitive' } },
                { assetTag: { contains: q, mode: 'insensitive' } },
                { serialNumber: { contains: q, mode: 'insensitive' } },
                { manufacturer: { contains: q, mode: 'insensitive' } },
                { model: { contains: q, mode: 'insensitive' } },
            ];
        }
        if (filter?.categoryId) {
            where.categoryId = filter.categoryId;
        }
        if (filter?.locationId) {
            where.locationId = filter.locationId;
        }
        if (filter?.status) {
            where.status = filter.status;
        }
        if (filter?.criticality) {
            where.criticality = filter.criticality;
        }
        return this.prisma.asset.findMany({
            where,
            include: {
                category: true,
                location: true,
            },
            orderBy: { assetTag: 'asc' },
        });
    }
    async findById(id) {
        const asset = await this.prisma.asset.findUnique({
            where: { id },
            include: {
                category: true,
                location: true,
            },
        });
        if (!asset) {
            throw new common_1.NotFoundException(`Asset with ID ${id} not found`);
        }
        return asset;
    }
    async findByTag(assetTag) {
        const normalizedTag = assetTag.trim().toUpperCase();
        const asset = await this.prisma.asset.findUnique({
            where: { assetTag: normalizedTag },
            include: {
                category: true,
                location: true,
            },
        });
        if (!asset) {
            throw new common_1.NotFoundException(`Asset with tag "${normalizedTag}" not found`);
        }
        return asset;
    }
    async createAsset(input, actorId) {
        const normalizedTag = input.assetTag.trim().toUpperCase();
        const category = await this.prisma.assetCategory.findUnique({
            where: { id: input.categoryId },
        });
        if (!category) {
            throw new common_1.BadRequestException(`Referenced asset category (ID: ${input.categoryId}) does not exist`);
        }
        const location = await this.prisma.location.findUnique({
            where: { id: input.locationId },
        });
        if (!location) {
            throw new common_1.BadRequestException(`Referenced location (ID: ${input.locationId}) does not exist`);
        }
        const existingTag = await this.prisma.asset.findUnique({
            where: { assetTag: normalizedTag },
        });
        if (existingTag) {
            throw new common_1.ConflictException(`Asset with tag "${normalizedTag}" already exists`);
        }
        const qrIdentifier = input.qrIdentifier?.trim() || `fixflow://assets/${normalizedTag}`;
        const existingQr = await this.prisma.asset.findUnique({
            where: { qrIdentifier },
        });
        if (existingQr) {
            throw new common_1.ConflictException(`Asset with QR identifier "${qrIdentifier}" already exists`);
        }
        const created = await this.prisma.asset.create({
            data: {
                assetTag: normalizedTag,
                name: input.name.trim(),
                description: input.description?.trim() || null,
                categoryId: input.categoryId,
                locationId: input.locationId,
                status: input.status || enums_1.AssetStatus.OPERATIONAL,
                criticality: input.criticality || undefined,
                conditionRating: input.conditionRating ?? 5,
                serialNumber: input.serialNumber?.trim() || null,
                manufacturer: input.manufacturer?.trim() || null,
                model: input.model?.trim() || null,
                installationDate: input.installationDate || null,
                warrantyExpiry: input.warrantyExpiry || null,
                qrIdentifier,
            },
            include: {
                category: true,
                location: true,
            },
        });
        await this.auditService.logAction(actorId || null, 'ASSET_CREATED', 'ASSET', created.id, {
            assetTag: created.assetTag,
            name: created.name,
            status: created.status,
            criticality: created.criticality,
        });
        return created;
    }
    async updateAsset(id, input, actorId) {
        const existing = await this.findById(id);
        if (input.categoryId && input.categoryId !== existing.categoryId) {
            const category = await this.prisma.assetCategory.findUnique({
                where: { id: input.categoryId },
            });
            if (!category) {
                throw new common_1.BadRequestException(`Referenced asset category (ID: ${input.categoryId}) does not exist`);
            }
        }
        if (input.locationId && input.locationId !== existing.locationId) {
            const location = await this.prisma.location.findUnique({
                where: { id: input.locationId },
            });
            if (!location) {
                throw new common_1.BadRequestException(`Referenced location (ID: ${input.locationId}) does not exist`);
            }
        }
        const updated = await this.prisma.asset.update({
            where: { id },
            data: {
                name: input.name !== undefined ? input.name.trim() : undefined,
                description: input.description !== undefined ? input.description.trim() : undefined,
                categoryId: input.categoryId || undefined,
                locationId: input.locationId || undefined,
                status: input.status || undefined,
                criticality: input.criticality || undefined,
                conditionRating: input.conditionRating !== undefined ? input.conditionRating : undefined,
                serialNumber: input.serialNumber !== undefined ? input.serialNumber.trim() : undefined,
                manufacturer: input.manufacturer !== undefined ? input.manufacturer.trim() : undefined,
                model: input.model !== undefined ? input.model.trim() : undefined,
                installationDate: input.installationDate !== undefined ? input.installationDate : undefined,
                warrantyExpiry: input.warrantyExpiry !== undefined ? input.warrantyExpiry : undefined,
            },
            include: {
                category: true,
                location: true,
            },
        });
        await this.auditService.logAction(actorId || null, 'ASSET_UPDATED', 'ASSET', updated.id, {
            assetTag: updated.assetTag,
            changes: Object.keys(input),
        });
        return updated;
    }
    async updateAssetStatus(id, status, actorId) {
        const existing = await this.findById(id);
        const updated = await this.prisma.asset.update({
            where: { id },
            data: { status },
            include: {
                category: true,
                location: true,
            },
        });
        await this.auditService.logAction(actorId || null, 'ASSET_STATUS_CHANGED', 'ASSET', updated.id, {
            previousStatus: existing.status,
            newStatus: status,
        });
        return updated;
    }
};
exports.AssetsService = AssetsService;
exports.AssetsService = AssetsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], AssetsService);
//# sourceMappingURL=assets.service.js.map