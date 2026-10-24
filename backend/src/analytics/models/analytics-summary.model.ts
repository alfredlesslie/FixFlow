import { Field, Int, Float, ObjectType } from '@nestjs/graphql';

@ObjectType({ description: 'Executive operational metrics and SLA performance indicators' })
export class AnalyticsSummary {
  @Field(() => Int, { description: 'Total maintenance requests logged' })
  totalRequests: number;

  @Field(() => Int, { description: 'Active unresolved requests' })
  unresolvedRequests: number;

  @Field(() => Int, { description: 'Urgent requests classified as CRITICAL or HIGH priority' })
  criticalOrHigh: number;

  @Field(() => Int, { description: 'Active dispatched technician work orders' })
  activeWorkOrders: number;

  @Field(() => Int, { description: 'Resolved work orders awaiting facility manager verification' })
  pendingVerification: number;

  @Field(() => Float, { description: 'SLA target compliance percentage rate' })
  slaComplianceRate: number;

  @Field(() => Float, { description: 'Mean Time to Resolution (MTTR) in hours' })
  mttrHours: number;
}
