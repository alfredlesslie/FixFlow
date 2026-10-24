import { Field, ID, ObjectType } from '@nestjs/graphql';
import { User } from '../../users/models/user.model';

@ObjectType({ description: 'Maintenance request conversational comment and diagnostic note' })
export class Comment {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  requestId: string;

  @Field(() => String)
  authorId: string;

  @Field(() => String, { description: 'Comment message body' })
  content: string;

  @Field(() => Boolean, { description: 'Whether this comment is an internal staff-only technical note' })
  isInternal: boolean;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => User, { nullable: true, description: 'Author institutional user profile' })
  author?: User | null;
}
