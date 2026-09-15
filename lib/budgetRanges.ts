import type { LeadBudgetRange } from "@/types/database";

/**
 * Numeric [min, max] naira bounds for each budget bracket, used to build the
 * homepage search filter's price query. `max: null` means no upper bound.
 * Kept separate from the labels in lib/schemas.ts since these bounds are a
 * query-building concern, not a display concern.
 */
export const BUDGET_RANGE_BOUNDS: Record<
  LeadBudgetRange,
  { min: number; max: number | null }
> = {
  under_30m: { min: 0, max: 30_000_000 },
  "30m_50m": { min: 30_000_000, max: 50_000_000 },
  "50m_100m": { min: 50_000_000, max: 100_000_000 },
  "100m_plus": { min: 100_000_000, max: null },
};
