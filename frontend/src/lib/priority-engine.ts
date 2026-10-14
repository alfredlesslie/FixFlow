import { PriorityFactors, PriorityLevel } from './types';

/**
 * FixFlow Dynamic Priority Scoring Engine
 * 
 * Computes an objective operational priority score (0-100) factoring in:
 * - Initial reported severity (1-10) -> 30 max points
 * - Affected asset criticality (1-10) -> 25 max points
 * - Community/Occupant upvotes -> up to 20 points
 * - Time spent unresolved (hours) -> up to 15 points
 * - Recurring failure frequency -> up to 10 points
 */
export function calculatePriorityScore(params: {
  initialSeverity: number;
  assetCriticality: number;
  upvotes: number;
  reportedAt: string;
  recurringCount: number;
  existingOverride?: {
    isOverridden: boolean;
    level: PriorityLevel;
    overrideReason?: string;
    reason?: string;
    overriddenBy?: string;
    overriddenAt?: string;
  };
}): PriorityFactors {
  const {
    initialSeverity = 5,
    assetCriticality = 5,
    upvotes = 0,
    reportedAt,
    recurringCount = 0,
    existingOverride,
  } = params;

  // 1. Severity Score: 0 - 30
  const severityScore = Math.min(30, Math.max(0, (initialSeverity / 10) * 30));

  // 2. Asset Criticality Score: 0 - 25
  const criticalityScore = Math.min(25, Math.max(0, (assetCriticality / 10) * 25));

  // 3. Upvotes Multiplier: 2.5 points per vote up to 20 max
  const upvoteScore = Math.min(20, upvotes * 2.5);

  // 4. Age Unresolved: 0.5 points per hour past 2 hours, capped at 15
  const ageInHours = Math.max(
    0,
    (Date.now() - new Date(reportedAt).getTime()) / (1000 * 60 * 60)
  );
  const ageScore = Math.min(15, Math.floor(ageInHours * 0.5));

  // 5. Recurring Count: 2.5 points per prior occurrence, capped at 10
  const recurringScore = Math.min(10, recurringCount * 2.5);

  // Total composite score (0 - 100)
  const compositeScore = Math.round(
    severityScore + criticalityScore + upvoteScore + ageScore + recurringScore
  );

  let calculatedLevel: PriorityLevel = 'LOW';
  if (compositeScore >= 85 || initialSeverity >= 9) {
    calculatedLevel = 'CRITICAL';
  } else if (compositeScore >= 65 || initialSeverity >= 7) {
    calculatedLevel = 'HIGH';
  } else if (compositeScore >= 35) {
    calculatedLevel = 'MEDIUM';
  }

  return {
    initialSeverity,
    assetCriticality,
    upvoteMultiplier: upvoteScore,
    unresolvedHoursWeight: ageScore,
    recurringMultiplier: recurringScore,
    calculatedScore: compositeScore,
    level: existingOverride?.isOverridden ? existingOverride.level : calculatedLevel,
    isOverridden: existingOverride?.isOverridden || false,
    overrideReason: existingOverride?.overrideReason,
    overriddenBy: existingOverride?.overriddenBy,
    overriddenAt: existingOverride?.overriddenAt,
  };
}
