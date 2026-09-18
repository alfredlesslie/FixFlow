import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType({ description: 'System audit and compliance log entry' })
export class AuditLog {
  @Field(() => ID)
  id: string;

  @Field(() => String, { nullable: true, description: 'ID of the user who performed the action' })
  actorId?: string | null;

  @Field(() => String, { description: 'Action performed, e.g. USER_LOGIN, ASSET_CREATED' })
  action: string;

  @Field(() => String, { description: 'Target entity type: USER, ASSET, LOCATION, etc.' })
  entity: string;

  @Field(() => String, { description: 'Target entity identifier' })
  entityId: string;

  @Field(() => String, { nullable: true, description: 'Serialized metadata payload' })
  metadata?: string | null;

  @Field(() => Date)
  timestamp: Date;
}
