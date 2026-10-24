import { InputType, Field, ID, Float } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsString, IsNumber, Min } from 'class-validator';

@InputType({ description: 'Payload for technician submission of repair completion and parts consumption' })
export class CompleteWorkOrderInput {
  @Field(() => ID)
  @IsNotEmpty({ message: 'Work order ID is required' })
  @IsString()
  id: string;

  @Field(() => String, { description: 'Detailed resolution summary describing how the issue was resolved' })
  @IsNotEmpty({ message: 'Resolution summary is required' })
  @IsString()
  resolutionSummary: string;

  @Field(() => String, { nullable: true, description: 'Diagnostic breakdown and root cause details' })
  @IsOptional()
  @IsString()
  repairDetails?: string;

  @Field(() => String, { nullable: true, description: 'Parts replaced and consumed during repair' })
  @IsOptional()
  @IsString()
  partsUsed?: string;

  @Field(() => Float, { nullable: true, description: 'Actual expenditures for parts and labor' })
  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Actual cost cannot be negative' })
  actualCost?: number;

  @Field(() => String, { nullable: true, description: 'Final technician notes' })
  @IsOptional()
  @IsString()
  workNotes?: string;
}
