import { InputType, Field } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty, MinLength, IsOptional, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
import { Role } from '../../common/enums';

@InputType({ description: 'Institutional requester (student/faculty) registration input' })
export class RegisterRequesterInput {
  @Field(() => String)
  @IsEmail({}, { message: 'Must be a valid institutional email address' })
  @Transform(({ value }) => (typeof value === 'string' ? value.toLowerCase().trim() : value))
  email: string;

  @Field(() => String)
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password: string;

  @Field(() => String)
  @IsNotEmpty({ message: 'First name is required' })
  firstName: string;

  @Field(() => String)
  @IsNotEmpty({ message: 'Last name is required' })
  lastName: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  department?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  phone?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  institutionalId?: string;
}

@InputType({ description: 'Institutional staff (technician or facility manager) registration input' })
export class RegisterStaffInput {
  @Field(() => String)
  @IsEmail({}, { message: 'Must be a valid institutional email address' })
  @Transform(({ value }) => (typeof value === 'string' ? value.toLowerCase().trim() : value))
  email: string;

  @Field(() => String)
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password: string;

  @Field(() => String)
  @IsNotEmpty({ message: 'First name is required' })
  firstName: string;

  @Field(() => String)
  @IsNotEmpty({ message: 'Last name is required' })
  lastName: string;

  @Field(() => Role, { description: 'Role requested: TECHNICIAN or FACILITY_MANAGER' })
  @IsEnum(Role, { message: 'Role must be a valid role' })
  requestedRole: Role;

  @Field(() => String)
  @IsNotEmpty({ message: 'Department is required for staff accounts' })
  department: string;

  @Field(() => String)
  @IsNotEmpty({ message: 'Contact number is required for emergency dispatch' })
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
