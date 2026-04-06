import { useMemo, useEffect } from "react";
import { useCalculator } from "@/context/CalculatorContext";
import { getPrice, suggestPlan, formatCurrency } from "@/lib/calculator";
import type { PlanId } from "@/lib/calculator";
import { Check, ChevronRight, Stethoscope, Pill, Hospital, Microscope } from "lucide-react";
import { cn } from "@/lib/utils";
import config from "@/data/saju-config.json";

const PLAN_IDS: PlanId[] = ["SAJU1100", "SAJU2100", "SAJU3100", "SAJU4100"];

const PLAN_TAG_COLORS: Record<string, string> = {
  "Económico": "bg-gray-100 text-gray-600",
  "Más Vendido": "bg-emerald-100 text-emerald-700",
  "Premium": "bg-purple-100 text-purple-700",
  "Total": "bg-amber-100 text-amber-700",
};

export function Step4Plan() {
  const { state, setSelectedPlan, setStep } = useCalculator();

  const suggested = useMemo(() => {
    if (!state.clientType || !state.holderAge) return null;
    return suggestPlan(state.clientType, state.holderAge, state.salary, state.monotributoCategory);
  }, [state.clientType, state.holderAge, state.salary, state.monotributoCategory]);

  useEffect(() => {
    if (suggested && !state.selectedPlan) {
      setSelectedPlan(suggested);
    }
  }, [suggested, state.selectedPlan, setSelectedPlan]);

  const plans = config.plans as Record<string, {
    id: string; name: string; coinsurance: boolean;
    pharmacyDiscount: number; internationType: string;
    complexStudies: boolean; description: string; tag: string;
  }>;

  function handleContinue() {
    if (!state.selectedPlan) return;
    setStep(5);
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-gray-900">¿Qué plan elegimos?</h2>
        <p className="text-sm text-gray-500 mt-1">
          {suggested ? (
            <>Plan sugerido: <span className="font-semibold text-blue-600">{plans[suggested]?.name}</span>. Podés cambiarlo.</>
          ) : "Seleccioná un plan para el titular"}
        </p>
      </div>

      <div className="space-y-3">
        {PLAN_IDS.map((planId) => {
          const plan = plans[planId];
          if (!plan) return null;
          const price = state.clientType && state.holderAge != null
            ? getPrice(state.clientType, state.holderAge, planId, state.monotributoCategory ?? undefined)
            : null;
          const isSelected = state.selectedPlan === planId;
          const isSuggested = planId === suggested;

          return (
            <button
              key={planId}
              onClick={() => setSelectedPlan(planId)}
              className={cn(
                "w-full flex gap-4 p-4 rounded-xl border-2 text-left transition-all duration-200",
                isSelected
                  ? "border-blue-500 bg-blue-50 shadow-sm"
                  : "border-gray-200 bg-white hover:border-blue-200 hover:bg-blue-50/20"
              )}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center flex-wrap gap-2 mb-2">
                  <span className={cn("font-bold text-sm", isSelected ? "text-blue-800" : "text-gray-800")}>
                    {planId} — {plan.name}
                  </span>
                  <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", PLAN_TAG_COLORS[plan.tag] ?? "bg-gray-100 text-gray-600")}>
                    {plan.tag}
                  </span>
                  {isSuggested && (
                    <span className="text-xs bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full border border-blue-200">
                      Sugerido
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mb-2">{plan.description}</p>
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  <Feature icon={Stethoscope} text={plan.coinsurance ? "Con coseguro" : "Sin coseguro"} active={!plan.coinsurance} />
                  <Feature icon={Pill} text={`${plan.pharmacyDiscount}% farmacia`} active />
                  <Feature icon={Hospital} text={internLabel(plan.internationType)} active={plan.internationType === "private"} />
                  <Feature icon={Microscope} text={plan.complexStudies ? "Estudios complejos" : "Sin estudios complejos"} active={plan.complexStudies} />
                </div>
              </div>
              <div className="flex flex-col items-end justify-between flex-shrink-0">
                {price != null ? (
                  <div className={cn("text-right", isSelected ? "text-blue-800" : "text-gray-700")}>
                    <div className="text-sm font-bold">{formatCurrency(price)}</div>
                    <div className="text-xs text-gray-400">/mes titular</div>
                  </div>
                ) : (
                  <div className="text-xs text-gray-400">—</div>
                )}
                <div className={cn(
                  "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                  isSelected ? "border-blue-500 bg-blue-500" : "border-gray-300"
                )}>
                  {isSelected && <Check className="w-3 h-3 text-white" />}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <button
        onClick={handleContinue}
        disabled={!state.selectedPlan}
        className={cn(
          "w-full py-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all mt-2",
          state.selectedPlan
            ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-200"
            : "bg-gray-100 text-gray-400 cursor-not-allowed"
        )}
      >
        Continuar <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

function Feature({ icon: Icon, text, active }: { icon: React.ElementType; text: string; active: boolean }) {
  return (
    <span className={cn("flex items-center gap-1 text-xs", active ? "text-emerald-600" : "text-gray-400")}>
      <Icon className="w-3 h-3" />
      {text}
    </span>
  );
}

function internLabel(type: string): string {
  const labels: Record<string, string> = {
    shared: "Internación compartida",
    shared_private_discount: "Compartida con descuento privado",
    private: "Internación privada",
  };
  return labels[type] ?? type;
}
