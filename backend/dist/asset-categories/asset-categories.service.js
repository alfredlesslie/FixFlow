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
exports.AssetCategoriesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
let AssetCategoriesService = class AssetCategoriesService {
    constructor(prisma, auditService) {
        this.prisma = prisma;
        this.auditService = auditService;
    }
    async findAll() {
        return this.prisma.assetCategory.findMany({
            orderBy: { name: 'asc' },
        });
    }
    async findById(id) {
        const cat = await this.prisma.assetCategory.findUnique({
            where: { id },
        });
        if (!cat) {
            throw new common_1.NotFoundException(`Asset category with ID ${id} not found`);
        }
        return cat;
    }
    async findByCode(code) {
        return this.prisma.assetCategory.findUnique({
            where: { code },
        });
    }
    async createCategory(input, actorId) {
        const normalizedCode = input.code.toUpperCase().trim();
        const existingCode = await this.findByCode(normalizedCode);
        if (existingCode) {
            throw new common_1.ConflictException(`Category with code "${normalizedCode}" already exists`);
        }
        const existingName = await this.prisma.assetCategory.findUnique({
            where: { name: input.name.trim() },
        });
        if (existingName) {
            throw new common_1.ConflictException(`Category with name "${input.name.trim()}" already exists`);
        }
        const category = await this.prisma.assetCategory.create({
            data: {
                code: normalizedCode,
                name: input.name.trim(),
                description: input.description ? input.description.trim() : null,
                defaultMaintenanceIntervalDays: input.defaultMaintenanceIntervalDays || 90,
            },
        });
        await this.auditService.logAction(actorId || null, 'CATEGORY_CREATED', 'ASSET_CATEGORY', category.id, {
            code: category.code,
            name: category.name,
        });
        return category;
    }
    async updateCategory(id, input, actorId) {
        await this.findById(id);
        if (input.name) {
            const existingName = await this.prisma.assetCategory.findFirst({
                where: { name: input.name.trim(), NOT: { id } },
            });
            if (existingName) {
                throw new common_1.ConflictException(`Another category with name "${input.name.trim()}" already exists`);
            }
        }
        const updated = await this.prisma.assetCategory.update({
            where: { id },
            data: {
                name: input.name !== undefined ? input.name.trim() : undefined,
                description: input.description !== undefined ? input.description.trim() : undefined,
                defaultMaintenanceIntervalDays: input.defaultMaintenanceIntervalDays !== undefined
                    ? input.defaultMaintenanceIntervalDays
                    : undefined,
            },
        });
        await this.auditService.logAction(actorId || null, 'CATEGORY_UPDATED', 'ASSET_CATEGORY', updated.id, {
            code: updated.code,
        });
        return updated;
    }
};
exports.AssetCategoriesService = AssetCategoriesService;
exports.AssetCategoriesService = AssetCategoriesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], AssetCategoriesService);
//# sourceMappingURL=asset-categories.service.js.map