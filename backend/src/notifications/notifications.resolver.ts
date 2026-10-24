import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { Notification } from './models/notification.model';
import { GqlAuthGuard } from '../common/guards/gql-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/models/user.model';

@Resolver(() => Notification)
export class NotificationsResolver {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Query(() => [Notification], {
    name: 'notifications',
    description: 'Retrieve institutional activity notifications for the currently authenticated user',
  })
  @UseGuards(GqlAuthGuard)
  async getNotifications(@CurrentUser() user: User): Promise<Notification[]> {
    return this.notificationsService.findForUser(user.id);
  }

  @Mutation(() => Notification, {
    description: 'Mark an individual notification as read',
  })
  @UseGuards(GqlAuthGuard)
  async markNotificationAsRead(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: User,
  ): Promise<Notification> {
    return this.notificationsService.markAsRead(id, user.id);
  }

  @Mutation(() => Boolean, {
    description: 'Mark all unread notifications as read for the current user',
  })
  @UseGuards(GqlAuthGuard)
  async markAllNotificationsAsRead(@CurrentUser() user: User): Promise<boolean> {
    return this.notificationsService.markAllAsRead(user.id);
  }
}
