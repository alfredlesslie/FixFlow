import { Field, ObjectType, Float } from '@nestjs/graphql';

@ObjectType({ description: 'FixFlow system health check response' })
export class HealthCheckPayload {
  @Field(() => String, { description: 'Overall system health status: ok | degraded' })
  status: string;

  @Field(() => String, { description: 'Application service name' })
  service: string;

  @Field(() => String, { description: 'Current environment' })
  environment: string;

  @Field(() => Float, { description: 'Process uptime in seconds' })
  uptime: number;

  @Field(() => String, { description: 'ISO timestamp of the health check' })
  timestamp: string;

  @Field(() => String, { description: 'Database connectivity status: connected | disconnected' })
  database: string;
}
