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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditResolver = void 0;
const graphql_1 = require("@nestjs/graphql");
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_log_model_1 = require("./models/audit-log.model");
const enums_1 = require("../common/enums");
const gql_auth_guard_1 = require("../common/guards/gql-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
let AuditResolver = class AuditResolver {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getAuditLogs(entity, limit) {
        const logs = await this.prisma.auditLog.findMany({
            where: entity ? { entity } : undefined,
            take: limit || 50,
            orderBy: { timestamp: 'desc' },
        });
        return logs.map((l) => ({
            id: l.id,
            actorId: l.actorId,
            action: l.action,
            entity: l.entity,
            entityId: l.entityId,
            metadata: l.metadata ? JSON.stringify(l.metadata) : null,
            timestamp: l.timestamp,
        }));
    }
};
exports.AuditResolver = AuditResolver;
__decorate([
    (0, graphql_1.Query)(() => [audit_log_model_1.AuditLog], {
        name: 'auditLogs',
        description: 'Retrieve system security and operational audit logs (Admin only)',
    }),
    (0, common_1.UseGuards)(gql_auth_guard_1.GqlAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(enums_1.Role.ADMIN),
    __param(0, (0, graphql_1.Args)('entity', { type: () => String, nullable: true })),
    __param(1, (0, graphql_1.Args)('limit', { type: () => graphql_1.Int, nullable: true, defaultValue: 50 })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], AuditResolver.prototype, "getAuditLogs", null);
exports.AuditResolver = AuditResolver = __decorate([
    (0, graphql_1.Resolver)(() => audit_log_model_1.AuditLog),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AuditResolver);
//# sourceMappingURL=audit.resolver.js.map