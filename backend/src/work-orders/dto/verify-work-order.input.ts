import { InputType, Field, ID } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsString, IsBoolean } from 'class-validator';

@InputType({ description: 'Payload for facility manager sign-off or rejection of completed work' })
export class VerifyWorkOrderInput {
  @Field(() => ID)
  @IsNotEmpty({ message: 'Work order ID is required' })
  @IsString()
  id: string;

  @Field(() => Boolean, { description: 'Whether the repair work is approved and verified as satisfactory' })
  @IsNotEmpty()
  @IsBoolean()
  approved: boolean;

  @Field(() => String, { nullable: true, description: 'Verification findings or rework instructions if rejected' })
  @IsOptional()
  @IsString()
  notes?: string;
}
