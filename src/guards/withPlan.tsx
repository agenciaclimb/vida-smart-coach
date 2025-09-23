import React from "react";
import { hasAccess, trialDaysLeft, PlanTier } from "@/lib/paywall";

type FeatureGate = "all" | "premiumOnly" | "vipOnly";

interface WithPlanProps {
  userPlan?: PlanTier;
  trialStart?: string;
}

export function withPlan<P extends object>(
  Component: React.ComponentType<P>,
  feature: FeatureGate = "all"
) {
  return function GuardedComponent(props: P & WithPlanProps) {
    const tier = props.userPlan ?? "basic";

    if (!hasAccess(tier, feature)) {
      const left = trialDaysLeft(props.trialStart, 7);
      return (
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <h3 className="text-lg font-semibold mb-1">Recurso Premium</h3>
          <p className="text-sm text-gray-600 mb-3">
            {left > 0
              ? `Você está em período de teste. ${left} ${left === 1 ? "dia" : "dias"} restantes.`
              : "Faça upgrade para liberar este recurso."}
          </p>
          <a
            href="/billing"
            className="inline-flex items-center justify-center rounded-md bg-black px-3 py-2 text-sm font-medium text-white"
          >
            Fazer upgrade
          </a>
        </div>
      );
    }

    const forwarded = props as P;
    return <Component {...forwarded} />;
  };
}
