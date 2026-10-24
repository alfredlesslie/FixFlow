import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { Role } from '../../common/enums';

@InputType({ description: 'Reapplication input for previously rejected institutional applicants' })
export class ReapplyInput {
  @Field(() => Role, { description: 'Role requested: TECHNICIAN or FACILITY_MANAGER' })
  @IsEnum(Role, { message: 'Must be a valid requested role' })
  requestedRole: Role;

  @Field(() => String)
  @IsNotEmpty({ message: 'Department is required' })
  department: string;

  @Field(() => String)
  @IsNotEmpty({ message: 'Contact number is required' })
  contactNumber: string;

  @Field(() => String)
  @IsNotEmpty({ message: 'Institutional employee/staff ID is required' })
  institutionalId: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  tradeDiscipline?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  certificationNumber?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  yearsExperience?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  facilityScope?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  appointmentJustification?: string;
}
