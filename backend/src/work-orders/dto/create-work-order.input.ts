import { InputType, Field, ID, Float } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsString, IsNumber, Min } from 'class-validator';

@InputType({ description: 'Payload for creating and dispatching a technician work order' })
export class CreateWorkOrderInput {
  @Field(() => ID, { description: 'ID of the maintenance request to resolve' })
  @IsNotEmpty({ message: 'Request ID is required' })
  @IsString()
  requestId: string;

  @Field(() => ID, { description: 'ID of the technician assigned to execute the repair' })
  @IsNotEmpty({ message: 'Technician ID is required' })
  @IsString()
  technicianId: string;

  @Field(() => String, { nullable: true, description: 'Dispatch instructions and safety guidelines' })
  @IsOptional()
  @IsString()
  instructions?: string;

  @Field(() => Float, { nullable: true, description: 'Estimated repair cost' })
  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Estimated cost cannot be negative' })
  estimatedCost?: number;
}
