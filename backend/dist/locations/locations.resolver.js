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
exports.LocationsResolver = void 0;
const graphql_1 = require("@nestjs/graphql");
const common_1 = require("@nestjs/common");
const locations_service_1 = require("./locations.service");
const location_model_1 = require("./models/location.model");
const create_location_input_1 = require("./dto/create-location.input");
const update_location_input_1 = require("./dto/update-location.input");
const enums_1 = require("../common/enums");
const gql_auth_guard_1 = require("../common/guards/gql-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const user_model_1 = require("../users/models/user.model");
let LocationsResolver = class LocationsResolver {
    constructor(locationsService) {
        this.locationsService = locationsService;
    }
    async getLocations() {
        return this.locationsService.findAll();
    }
    async getLocation(id) {
        return this.locationsService.findById(id);
    }
    async createLocation(input, user) {
        return this.locationsService.createLocation(input, user.id);
    }
    async updateLocation(id, input, user) {
        return this.locationsService.updateLocation(id, input, user.id);
    }
};
exports.LocationsResolver = LocationsResolver;
__decorate([
    (0, graphql_1.Query)(() => [location_model_1.Location], {
        name: 'locations',
        description: 'Retrieve all campus facilities, buildings, and rooms',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], LocationsResolver.prototype, "getLocations", null);
__decorate([
    (0, graphql_1.Query)(() => location_model_1.Location, {
        name: 'location',
        description: 'Retrieve details of a specific campus location by ID',
    }),
    __param(0, (0, graphql_1.Args)('id', { type: () => graphql_1.ID })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LocationsResolver.prototype, "getLocation", null);
__decorate([
    (0, graphql_1.Mutation)(() => location_model_1.Location, {
        description: 'Create a new campus location (Facility Manager or Admin only)',
    }),
    (0, common_1.UseGuards)(gql_auth_guard_1.GqlAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(enums_1.Role.FACILITY_MANAGER, enums_1.Role.ADMIN),
    __param(0, (0, graphql_1.Args)('input')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_location_input_1.CreateLocationInput,
        user_model_1.User]),
    __metadata("design:returntype", Promise)
], LocationsResolver.prototype, "createLocation", null);
__decorate([
    (0, graphql_1.Mutation)(() => location_model_1.Location, {
        description: 'Update campus location details (Facility Manager or Admin only)',
    }),
    (0, common_1.UseGuards)(gql_auth_guard_1.GqlAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(enums_1.Role.FACILITY_MANAGER, enums_1.Role.ADMIN),
    __param(0, (0, graphql_1.Args)('id', { type: () => graphql_1.ID })),
    __param(1, (0, graphql_1.Args)('input')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_location_input_1.UpdateLocationInput,
        user_model_1.User]),
    __metadata("design:returntype", Promise)
], LocationsResolver.prototype, "updateLocation", null);
exports.LocationsResolver = LocationsResolver = __decorate([
    (0, graphql_1.Resolver)(() => location_model_1.Location),
    __metadata("design:paramtypes", [locations_service_1.LocationsService])
], LocationsResolver);
//# sourceMappingURL=locations.resolver.js.map