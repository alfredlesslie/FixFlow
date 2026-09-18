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
exports.HealthResolver = void 0;
const graphql_1 = require("@nestjs/graphql");
const health_model_1 = require("./health.model");
const prisma_service_1 = require("../prisma/prisma.service");
let HealthResolver = class HealthResolver {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async healthCheck() {
        const isDbAlive = await this.prisma.checkHealth();
        return {
            status: isDbAlive ? 'ok' : 'degraded',
            service: 'FixFlow API Service',
            environment: process.env.NODE_ENV || 'development',
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
            database: isDbAlive ? 'connected' : 'disconnected',
        };
    }
};
exports.HealthResolver = HealthResolver;
__decorate([
    (0, graphql_1.Query)(() => health_model_1.HealthCheckPayload, {
        name: 'healthCheck',
        description: 'System health check and database connectivity verification',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HealthResolver.prototype, "healthCheck", null);
exports.HealthResolver = HealthResolver = __decorate([
    (0, graphql_1.Resolver)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], HealthResolver);
//# sourceMappingURL=health.resolver.js.map