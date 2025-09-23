export type PlanTier = "basic" | "premium" | "vip";

export function hasAccess(
  tier: PlanTier,
  feature: "all" | "premiumOnly" | "vipOnly" = "all"
): boolean {
  if (feature === "all") return true;
  if (feature === "premiumOnly") return tier === "premium" || tier === "vip";
  if (feature === "vipOnly") return tier === "vip";
  return false;
}

export function trialDaysLeft(trialStartISO?: string, trialDays = 7): number {
  if (!trialStartISO) return 0;
  const start = new Date(trialStartISO).getTime();
  if (Number.isNaN(start)) return 0;
  const end = start + trialDays * 86_400_000;
  const diff = Math.ceil((end - Date.now()) / 86_400_000);
  return Math.max(0, diff);
}
