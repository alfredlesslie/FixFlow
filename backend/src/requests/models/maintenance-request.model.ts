import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { Priority, RequestStatus } from '../../common/enums';
import { User } from '../../users/models/user.model';
import { Location } from '../../locations/models/location.model';
import { Asset } from '../../assets/models/asset.model';

@ObjectType({ description: 'Institutional campus maintenance request specification and operational lifecycle' })
export class MaintenanceRequest {
  @Field(() => ID)
  id: string;

  @Field(() => String, { description: 'Unique institutional request tracking number, e.g. REQ-2026-0001' })
  requestNumber: string;

  @Field(() => String, { description: 'Concise summary of the maintenance issue' })
  title: string;

  @Field(() => String, { description: 'Detailed problem description and symptoms' })
  description: string;

  @Field(() => String)
  requesterId: string;

  @Field(() => String)
  locationId: string;

  @Field(() => String, { nullable: true })
  assetId?: string | null;

  @Field(() => Priority, { description: 'Derived maintenance priority level: LOW, MEDIUM, HIGH, CRITICAL' })
  priority: Priority;

  @Field(() => RequestStatus, {
    description: 'Request lifecycle state: OPEN, TRIAGED, ASSIGNED, IN_PROGRESS, RESOLVED, VERIFIED, CLOSED, REOPENED',
  })
  status: RequestStatus;

  @Field(() => Int, { description: 'Target resolution duration in hours' })
  slaTargetHours: number;

  @Field(() => Date, { description: 'SLA target resolution deadline' })
  slaDeadline: Date;

  @Field(() => Boolean, { description: 'Whether SLA target deadline has been breached' })
  slaBreached: boolean;

  @Field(() => String, { nullable: true, description: 'Administrative rejection rationale if rejected' })
  rejectionReason?: string | null;

  @Field(() => String, { nullable: true, description: 'Post-resolution verification findings' })
  verificationNotes?: string | null;

  @Field(() => Date, { nullable: true, description: 'Timestamp when maintenance resolution occurred' })
  resolvedAt?: Date | null;

  @Field(() => Date, { nullable: true, description: 'Timestamp when request was closed and verified' })
  closedAt?: Date | null;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;

  @Field(() => User, { description: 'Campus user who reported this maintenance request' })
  requester: User;

  @Field(() => Location, { description: 'Physical campus housing location' })
  location: Location;

  @Field(() => Asset, { nullable: true, description: 'Optional affected campus asset' })
  asset?: Asset | null;

  @Field(() => Int, { defaultValue: 0, description: 'Total occupant and community upvotes' })
  upvotesCount: number;

  @Field(() => Boolean, { defaultValue: false, description: 'Whether current authenticated user has upvoted this request' })
  hasUpvoted: boolean;

  @Field(() => Boolean, { defaultValue: false, description: 'Whether this request has been marked as a duplicate' })
  isDuplicate: boolean;

  @Field(() => String, { nullable: true, description: 'Original request tracking ID if this request is a duplicate' })
  duplicateOfId?: string | null;

  @Field(() => String, { nullable: true, description: 'Original request number (e.g. REQ-2026-0001) if marked as duplicate' })
  duplicateOfNumber?: string | null;

  @Field(() => String, { nullable: true, description: 'Reason this request was marked as a duplicate' })
  duplicateReason?: string | null;
}
