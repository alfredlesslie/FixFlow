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
exports.HealthCheckPayload = void 0;
const graphql_1 = require("@nestjs/graphql");
let HealthCheckPayload = class HealthCheckPayload {
};
exports.HealthCheckPayload = HealthCheckPayload;
__decorate([
    (0, graphql_1.Field)(() => String, { description: 'Overall system health status: ok | degraded' }),
    __metadata("design:type", String)
], HealthCheckPayload.prototype, "status", void 0);
__decorate([
    (0, graphql_1.Field)(() => String, { description: 'Application service name' }),
    __metadata("design:type", String)
], HealthCheckPayload.prototype, "service", void 0);
__decorate([
    (0, graphql_1.Field)(() => String, { description: 'Current environment' }),
    __metadata("design:type", String)
], HealthCheckPayload.prototype, "environment", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Float, { description: 'Process uptime in seconds' }),
    __metadata("design:type", Number)
], HealthCheckPayload.prototype, "uptime", void 0);
__decorate([
    (0, graphql_1.Field)(() => String, { description: 'ISO timestamp of the health check' }),
    __metadata("design:type", String)
], HealthCheckPayload.prototype, "timestamp", void 0);
__decorate([
    (0, graphql_1.Field)(() => String, { description: 'Database connectivity status: connected | disconnected' }),
    __metadata("design:type", String)
], HealthCheckPayload.prototype, "database", void 0);
exports.HealthCheckPayload = HealthCheckPayload = __decorate([
    (0, graphql_1.ObjectType)({ description: 'FixFlow system health check response' })
], HealthCheckPayload);
//# sourceMappingURL=health.model.js.map