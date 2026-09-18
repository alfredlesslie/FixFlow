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
exports.Location = void 0;
const graphql_1 = require("@nestjs/graphql");
let Location = class Location {
};
exports.Location = Location;
__decorate([
    (0, graphql_1.Field)(() => graphql_1.ID),
    __metadata("design:type", String)
], Location.prototype, "id", void 0);
__decorate([
    (0, graphql_1.Field)(() => String, { description: 'Unique identifier code, e.g. ENG-BLD-101' }),
    __metadata("design:type", String)
], Location.prototype, "code", void 0);
__decorate([
    (0, graphql_1.Field)(() => String, { description: 'Descriptive location name' }),
    __metadata("design:type", String)
], Location.prototype, "name", void 0);
__decorate([
    (0, graphql_1.Field)(() => String, { description: 'Campus building name' }),
    __metadata("design:type", String)
], Location.prototype, "building", void 0);
__decorate([
    (0, graphql_1.Field)(() => String, { description: 'Floor level' }),
    __metadata("design:type", String)
], Location.prototype, "floor", void 0);
__decorate([
    (0, graphql_1.Field)(() => String, { nullable: true, description: 'Room or hall number' }),
    __metadata("design:type", String)
], Location.prototype, "roomNumber", void 0);
__decorate([
    (0, graphql_1.Field)(() => String, { nullable: true, description: 'Additional location remarks' }),
    __metadata("design:type", String)
], Location.prototype, "description", void 0);
__decorate([
    (0, graphql_1.Field)(() => Date),
    __metadata("design:type", Date)
], Location.prototype, "createdAt", void 0);
__decorate([
    (0, graphql_1.Field)(() => Date),
    __metadata("design:type", Date)
], Location.prototype, "updatedAt", void 0);
exports.Location = Location = __decorate([
    (0, graphql_1.ObjectType)({ description: 'Campus building, wing, or laboratory location' })
], Location);
//# sourceMappingURL=location.model.js.map