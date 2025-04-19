export type RealmStatus =
  | "Dormant"
  | "Sprouting"
  | "Growing"
  | "Flourishing"
  | "Radiant"
  | "Ascendant";

export interface RealmTier {
  status: RealmStatus;
  minPercentage: number;
  maxPercentage: number;
}

const REALM_TIERS: RealmTier[] = [
  { status: "Dormant", minPercentage: 0, maxPercentage: 9 },
  { status: "Sprouting", minPercentage: 10, maxPercentage: 29 },
  { status: "Growing", minPercentage: 30, maxPercentage: 59 },
  { status: "Flourishing", minPercentage: 60, maxPercentage: 89 },
  { status: "Radiant", minPercentage: 90, maxPercentage: 99 },
  { status: "Ascendant", minPercentage: 100, maxPercentage: Infinity },
];

/**
 * Calculate realm status based on savings progress
 * @param savingsAchieved Current savings amount
 * @param savingsGoal Target savings goal
 * @returns RealmStatus string
 */
export function calculateRealmStatus(
  savingsAchieved: number,
  savingsGoal: number
): RealmStatus {
  const percentage = Math.floor((savingsAchieved / savingsGoal) * 100);

  const tier = REALM_TIERS.find(
    (tier) =>
      percentage >= tier.minPercentage && percentage <= tier.maxPercentage
  );

  return tier?.status || "Dormant";
}
