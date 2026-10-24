import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType({ description: 'Institutional system notification and activity alert' })
export class Notification {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  userId: string;

  @Field(() => String, { description: 'Notification subject headline' })
  title: string;

  @Field(() => String, { description: 'Detailed notification message body' })
  message: string;

  @Field(() => String, { description: 'Notification category, e.g. WORK_ORDER_ASSIGNED' })
  type: string;

  @Field(() => Boolean, { description: 'Whether the notification has been marked as read' })
  isRead: boolean;

  @Field(() => String, { nullable: true, description: 'Direct navigation link' })
  link?: string | null;

  @Field(() => Date)
  createdAt: Date;
}
