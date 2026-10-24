import { Resolver, Query } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsSummary } from './models/analytics-summary.model';
import { GqlAuthGuard } from '../common/guards/gql-auth.guard';

@Resolver(() => AnalyticsSummary)
export class AnalyticsResolver {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Query(() => AnalyticsSummary, {
    name: 'analyticsSummary',
    description: 'Retrieve campus-wide live operational analytics, unresolved counts, and SLA metrics',
  })
  @UseGuards(GqlAuthGuard)
  async getAnalyticsSummary(): Promise<AnalyticsSummary> {
    return this.analyticsService.getSummary();
  }
}
