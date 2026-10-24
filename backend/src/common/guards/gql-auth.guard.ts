import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Reflector } from '@nestjs/core';
import { AccountStatus } from '../enums';
import { ALLOW_REJECTED_KEY } from '../decorators/allow-rejected.decorator';

@Injectable()
export class GqlAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector?: Reflector) {
    super();
  }

  getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    const req = ctx.getContext()?.req;
    if (!req) {
      throw new UnauthorizedException('Missing request context in GraphQL execution');
    }
    return req;
  }

  getResponse(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext()?.res;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const activated = await (super.canActivate(context) as Promise<boolean>);
    if (!activated) return false;

    const ctx = GqlExecutionContext.create(context);
    const user = ctx.getContext()?.req?.user;

    if (user && user.status === AccountStatus.REJECTED) {
      if (!this.reflector) {
        throw new ForbiddenException(
          'Security evaluation failed: Reflector dependency is unavailable. Access denied.',
        );
      }

      const allowRejected = this.reflector.getAllAndOverride<boolean>(ALLOW_REJECTED_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);

      if (!allowRejected) {
        throw new ForbiddenException(
          'Account registration application was rejected. Access to general operations is restricted; you may only submit a revised application.',
        );
      }
    }

    return true;
  }
}
