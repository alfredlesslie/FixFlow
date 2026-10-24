import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Role, ApplicationStatus } from '../../common/enums';

@ObjectType({ description: 'Institutional role application for administrator review' })
export class RegistrationApplication {
  @Field(() => ID)
  id: string;

  @Field(() => String, { nullable: true })
  userId?: string | null;

  @Field(() => String)
  applicantName: string;

  @Field(() => String)
  applicantEmail: string;

  @Field(() => String)
  institutionalId: string;

  @Field(() => String)
  department: string;

  @Field(() => String)
  contactNumber: string;

  @Field(() => Role)
  requestedRole: Role;

  @Field(() => ApplicationStatus)
  status: ApplicationStatus;

  @Field(() => Boolean)
  emailVerified: boolean;

  @Field(() => String, { nullable: true })
  tradeDiscipline?: string | null;

  @Field(() => String, { nullable: true })
  certificationNumber?: string | null;

  @Field(() => String, { nullable: true })
  yearsExperience?: string | null;

  @Field(() => String, { nullable: true })
  facilityScope?: string | null;

  @Field(() => String, { nullable: true })
  appointmentJustification?: string | null;

  @Field(() => String, { nullable: true })
  rejectionReason?: string | null;

  @Field(() => String, { nullable: true })
  reviewedById?: string | null;

  @Field(() => Date, { nullable: true })
  reviewedAt?: Date | null;

  @Field(() => Date)
  submittedAt: Date;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
