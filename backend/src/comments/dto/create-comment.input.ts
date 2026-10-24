import { InputType, Field, ID } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsString, IsBoolean, Length } from 'class-validator';

@InputType({ description: 'Payload for posting a conversational comment or internal note on a request' })
export class CreateCommentInput {
  @Field(() => ID)
  @IsNotEmpty({ message: 'Request ID is required' })
  @IsString()
  requestId: string;

  @Field(() => String, { description: 'Comment text content' })
  @IsNotEmpty({ message: 'Comment content cannot be empty' })
  @IsString()
  @Length(1, 2000, { message: 'Comment must be between 1 and 2000 characters' })
  content: string;

  @Field(() => Boolean, {
    nullable: true,
    defaultValue: false,
    description: 'Whether note is restricted to staff (technicians and facility managers)',
  })
  @IsOptional()
  @IsBoolean()
  isInternal?: boolean;
}
