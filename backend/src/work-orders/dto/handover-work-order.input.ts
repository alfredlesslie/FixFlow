import { InputType, Field, ID } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

@InputType({ description: 'Payload for transferring active work order responsibility to another technician' })
export class HandoverWorkOrderInput {
  @Field(() => ID)
  @IsNotEmpty({ message: 'Work order ID is required' })
  @IsString()
  workOrderId: string;

  @Field(() => ID, { description: 'ID of the technician assuming responsibility' })
  @IsNotEmpty({ message: 'Next technician ID is required' })
  @IsString()
  nextTechId: string;

  @Field(() => String, { description: 'Technical notes and status for the incoming technician' })
  @IsNotEmpty({ message: 'Handover notes are mandatory for active reassignment' })
  @IsString()
  handoverNotes: string;

  @Field(() => String, { nullable: true, description: 'Reason for transfer (shift change, specialized tooling, etc.)' })
  @IsOptional()
  @IsString()
  reason?: string;
}
