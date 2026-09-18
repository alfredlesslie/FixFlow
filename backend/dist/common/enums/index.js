"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkOrderStatus = exports.RequestStatus = exports.Priority = exports.Criticality = exports.AssetStatus = exports.Role = exports.ScheduleStatus = void 0;
const graphql_1 = require("@nestjs/graphql");
const client_1 = require("@prisma/client");
Object.defineProperty(exports, "Role", { enumerable: true, get: function () { return client_1.Role; } });
Object.defineProperty(exports, "AssetStatus", { enumerable: true, get: function () { return client_1.AssetStatus; } });
Object.defineProperty(exports, "Criticality", { enumerable: true, get: function () { return client_1.Criticality; } });
Object.defineProperty(exports, "Priority", { enumerable: true, get: function () { return client_1.Priority; } });
Object.defineProperty(exports, "RequestStatus", { enumerable: true, get: function () { return client_1.RequestStatus; } });
Object.defineProperty(exports, "WorkOrderStatus", { enumerable: true, get: function () { return client_1.WorkOrderStatus; } });
var ScheduleStatus;
(function (ScheduleStatus) {
    ScheduleStatus["UPCOMING"] = "UPCOMING";
    ScheduleStatus["DUE"] = "DUE";
    ScheduleStatus["OVERDUE"] = "OVERDUE";
    ScheduleStatus["COMPLETED"] = "COMPLETED";
})(ScheduleStatus || (exports.ScheduleStatus = ScheduleStatus = {}));
(0, graphql_1.registerEnumType)(client_1.Role, {
    name: 'Role',
    description: 'User access control roles in FixFlow',
});
(0, graphql_1.registerEnumType)(client_1.AssetStatus, {
    name: 'AssetStatus',
    description: 'Operational lifecycle status of campus assets',
});
(0, graphql_1.registerEnumType)(client_1.Criticality, {
    name: 'Criticality',
    description: 'Criticality level of campus equipment',
});
(0, graphql_1.registerEnumType)(client_1.Priority, {
    name: 'Priority',
    description: 'Maintenance request priority level',
});
(0, graphql_1.registerEnumType)(client_1.RequestStatus, {
    name: 'RequestStatus',
    description: 'Maintenance request lifecycle state',
});
(0, graphql_1.registerEnumType)(client_1.WorkOrderStatus, {
    name: 'WorkOrderStatus',
    description: 'Technician work order state',
});
(0, graphql_1.registerEnumType)(ScheduleStatus, {
    name: 'ScheduleStatus',
    description: 'Preventive maintenance schedule state',
});
//# sourceMappingURL=index.js.map