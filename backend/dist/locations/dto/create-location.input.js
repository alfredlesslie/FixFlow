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
exports.CreateLocationInput = void 0;
const graphql_1 = require("@nestjs/graphql");
const class_validator_1 = require("class-validator");
let CreateLocationInput = class CreateLocationInput {
};
exports.CreateLocationInput = CreateLocationInput;
__decorate([
    (0, graphql_1.Field)(() => String, { description: 'Unique location code, e.g. ENG-BLD-101' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Location code is required' }),
    (0, class_validator_1.Matches)(/^[A-Z0-9\-_]+$/, {
        message: 'Location code must contain only uppercase letters, numbers, hyphens, and underscores',
    }),
    __metadata("design:type", String)
], CreateLocationInput.prototype, "code", void 0);
__decorate([
    (0, graphql_1.Field)(() => String, { description: 'Human-readable location name' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Location name is required' }),
    __metadata("design:type", String)
], CreateLocationInput.prototype, "name", void 0);
__decorate([
    (0, graphql_1.Field)(() => String, { description: 'Campus building name' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Building name is required' }),
    __metadata("design:type", String)
], CreateLocationInput.prototype, "building", void 0);
__decorate([
    (0, graphql_1.Field)(() => String, { description: 'Floor level' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Floor level is required' }),
    __metadata("design:type", String)
], CreateLocationInput.prototype, "floor", void 0);
__decorate([
    (0, graphql_1.Field)(() => String, { nullable: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateLocationInput.prototype, "roomNumber", void 0);
__decorate([
    (0, graphql_1.Field)(() => String, { nullable: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateLocationInput.prototype, "description", void 0);
exports.CreateLocationInput = CreateLocationInput = __decorate([
    (0, graphql_1.InputType)({ description: 'Payload for registering a new campus location' })
], CreateLocationInput);
//# sourceMappingURL=create-location.input.js.map