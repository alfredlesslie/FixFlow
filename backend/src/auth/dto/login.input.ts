import { InputType, Field } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

@InputType({ description: 'Institutional credentials for FixFlow sign-in' })
export class LoginInput {
  @Field(() => String, { description: 'Institutional email address' })
  @IsEmail({}, { message: 'A valid university email address is required' })
  @IsNotEmpty({ message: 'Email address cannot be empty' })
  email: string;

  @Field(() => String, { description: 'User password' })
  @IsNotEmpty({ message: 'Password cannot be empty' })
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password: string;
}
