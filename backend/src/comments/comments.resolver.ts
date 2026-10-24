import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { Comment } from './models/comment.model';
import { CreateCommentInput } from './dto/create-comment.input';
import { GqlAuthGuard } from '../common/guards/gql-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/models/user.model';

@Resolver(() => Comment)
export class CommentsResolver {
  constructor(private readonly commentsService: CommentsService) {}

  @Query(() => [Comment], {
    name: 'comments',
    description: 'Retrieve conversational comment history and staff notes for a maintenance request',
  })
  @UseGuards(GqlAuthGuard)
  async getComments(
    @Args('requestId', { type: () => ID }) requestId: string,
    @CurrentUser() user?: User,
  ): Promise<Comment[]> {
    return this.commentsService.findByRequestId(requestId, user);
  }

  @Mutation(() => Comment, {
    description: 'Post a comment or technical internal note on a maintenance request',
  })
  @UseGuards(GqlAuthGuard)
  async createComment(
    @Args('input') input: CreateCommentInput,
    @CurrentUser() user: User,
  ): Promise<Comment> {
    return this.commentsService.create(input, user);
  }
}
