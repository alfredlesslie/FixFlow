import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty } from 'class-validator';

@InputType({ description: 'Verification token input' })
export class VerifyEmailInput {
  @Field(() => String, { description: 'Raw verification token received via institutional email' })
  @IsNotEmpty({ message: 'Verification token is required' })
  token: string;
}

@InputType({ description: 'Resend verification email input' })
export class ResendVerificationInput {
  @Field(() => String)
  @IsNotEmpty({ message: 'Institutional email is required' })
  email: string;
}
