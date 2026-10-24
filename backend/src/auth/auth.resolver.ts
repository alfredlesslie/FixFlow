import { Resolver, Mutation, Query, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegistrationService } from './registration.service';
import { AdministratorApprovalsService } from './administrator-approvals.service';
import { LoginInput } from './dto/login.input';
import { AuthPayload } from './dto/auth-payload.type';
import { RegisterRequesterInput, RegisterStaffInput } from './dto/register.input';
import { VerifyEmailInput, ResendVerificationInput } from './dto/verify-email.input';
import { ReapplyInput } from './dto/reapply.input';
import {
  RegistrationResponse,
  VerifyEmailResponse,
  OperationStatusResponse,
} from './dto/registration-response.type';
import { RegistrationApplication } from './models/registration-application.model';
import { User } from '../users/models/user.model';
import { Role, ApplicationStatus } from '../common/enums';
import { GqlAuthGuard } from '../common/guards/gql-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AllowRejected } from '../common/decorators/allow-rejected.decorator';
import { RateLimitGuard, RateLimit } from '../common/guards/rate-limit.guard';
import { MailService } from '../mail/mail.service';

@Resolver()
export class AuthResolver {
  constructor(
    private readonly authService: AuthService,
    private readonly registrationService: RegistrationService,
    private readonly administratorApprovalsService: AdministratorApprovalsService,
    private readonly mailService: MailService,
  ) {}

  @Mutation(() => AuthPayload, {
    description: 'Authenticate an institutional user and issue a JWT Bearer token',
  })
  @UseGuards(RateLimitGuard)
  @RateLimit({ windowMs: 60000, max: 10, message: 'Too many login attempts. Please try again shortly.' })
  async login(@Args('input') input: LoginInput): Promise<AuthPayload> {
    return this.authService.login(input);
  }

  @Query(() => User, {
    name: 'me',
    description: 'Retrieve profile details of the currently authenticated user',
  })
  @UseGuards(GqlAuthGuard)
  @AllowRejected()
  async getMe(@CurrentUser() user: User): Promise<User> {
    return user;
  }

  @Query(() => String, {
    name: 'devLatestVerificationToken',
    nullable: true,
    description: 'Retrieve latest unhashed verification token for an email (Development environment only; fails closed in production)',
  })
  @UseGuards(RateLimitGuard)
  @RateLimit({ windowMs: 60000, max: 20 })
  async devLatestVerificationToken(@Args('email') email: string): Promise<string | null> {
    return this.mailService.getDevLatestToken(email);
  }

  @Mutation(() => RegistrationResponse, {
    description: 'Submit institutional requester registration (students & standard staff)',
  })
  @UseGuards(RateLimitGuard)
  @RateLimit({ windowMs: 60000, max: 10, message: 'Too many registration requests. Please try again shortly.' })
  async registerRequester(
    @Args('input') input: RegisterRequesterInput,
  ): Promise<RegistrationResponse> {
    return this.registrationService.registerRequester(input);
  }

  @Mutation(() => RegistrationResponse, {
    description: 'Submit institutional staff registration (technicians & facility managers)',
  })
  @UseGuards(RateLimitGuard)
  @RateLimit({ windowMs: 60000, max: 10, message: 'Too many registration requests. Please try again shortly.' })
  async registerStaff(
    @Args('input') input: RegisterStaffInput,
  ): Promise<RegistrationResponse> {
    return this.registrationService.registerStaff(input);
  }

  @Mutation(() => VerifyEmailResponse, {
    description: 'Verify institutional email address using secure single-use token',
  })
  @UseGuards(RateLimitGuard)
  @RateLimit({ windowMs: 60000, max: 20 })
  async verifyEmail(@Args('input') input: VerifyEmailInput): Promise<VerifyEmailResponse> {
    return this.registrationService.verifyEmail(input.token);
  }

  @Mutation(() => OperationStatusResponse, {
    description: 'Request a new email verification link with rate limiting cooldown',
  })
  @UseGuards(RateLimitGuard)
  @RateLimit({ windowMs: 60000, max: 5, message: 'Too many verification email requests. Please wait a moment.' })
  async resendVerificationEmail(
    @Args('input') input: ResendVerificationInput,
  ): Promise<OperationStatusResponse> {
    return this.registrationService.resendVerificationEmail(input.email);
  }

  @Mutation(() => RegistrationResponse, {
    description: 'Submit a revised application for a previously rejected registration',
  })
  @UseGuards(GqlAuthGuard)
  @AllowRejected()
  async reapplyRegistration(
    @Args('input') input: ReapplyInput,
    @CurrentUser() user: User,
  ): Promise<RegistrationResponse> {
    return this.registrationService.reapply(user.id, input);
  }

  // --- ADMINISTRATOR APPROVAL QUERIES & MUTATIONS ---

  @Query(() => [RegistrationApplication], {
    name: 'registrationApplications',
    description: 'Retrieve institutional registration applications with optional status filtering (Admin only)',
  })
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async getRegistrationApplications(
    @Args('status', { type: () => ApplicationStatus, nullable: true }) status?: ApplicationStatus,
  ): Promise<RegistrationApplication[]> {
    return this.administratorApprovalsService.getApplications(status);
  }

  @Query(() => RegistrationApplication, {
    name: 'registrationApplication',
    description: 'Retrieve details of a single registration application by ID (Admin only)',
  })
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async getRegistrationApplication(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<RegistrationApplication> {
    return this.administratorApprovalsService.getApplicationById(id);
  }

  @Mutation(() => RegistrationApplication, {
    description: 'Approve an institutional staff registration application and activate the user (Admin only)',
  })
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async approveRegistrationApplication(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() admin: User,
  ): Promise<RegistrationApplication> {
    return this.administratorApprovalsService.approveApplication(id, admin);
  }

  @Mutation(() => RegistrationApplication, {
    description: 'Reject an institutional staff registration application with documented reason (Admin only)',
  })
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async rejectRegistrationApplication(
    @Args('id', { type: () => ID }) id: string,
    @Args('reason') reason: string,
    @CurrentUser() admin: User,
  ): Promise<RegistrationApplication> {
    return this.administratorApprovalsService.rejectApplication(id, reason, admin);
  }
}
