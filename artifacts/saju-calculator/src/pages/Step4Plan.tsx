import { useMemo, useEffect } from "react";
import { useCalculator } from "@/context/CalculatorContext";
import { getPrice, getMonotributoAdicional, suggestPlan, formatCurrency } from "@/lib/calculator";
import type { PlanId } from "@/lib/calculator";
import { Check, ChevronRight, Stethoscope, Pill, Hospital, Microscope, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import config from "@/data/saju-config.json";

const ALL_PLAN_IDS: PlanId[] = ["SAJU500", "SAJU1100", "SAJU2100", "SAJU3100", "SAJU4100"];

const PLAN_TAG_COLORS: Record<string, string> = {
  "Inicial": "bg-slate-100 text-slate-600",
  "Económico": "bg-gray-100 text-gray-600",
  "Más Vendido": "bg-emerald-100 text-emerald-700",
  "Premium": "bg-purple-100 text-purple-700",
  "Total": "bg-amber-100 text-amber-700",
};

export function Step4Plan() {
  const { state, setSelectedPlan, setStep } = useCalculator();

  // Filter plans based on clientType using planAvailability from config
  const planAvailability = config.planAvailability as Record<string, string[]>;
  const availablePlanIds = useMemo<PlanId[]>(() => {
    if (!state.clientType) return ALL_PLAN_IDS;
    return ALL_PLAN_IDS.filter((id) => {
      const allowed = planAvailability[id];
      return allowed ? allowed.includes(state.clientType!) : true;
    });
  }, [state.clientType]);

  const suggested = useMemo(() => {
    if (!state.clientType || !state.holderAge) return null;
    const s = suggestPlan(state.clientType, state.holderAge, state.salary);
    // Make sure suggested plan is available for this client type
    return availablePlanIds.includes(s) ? s : availablePlanIds[0] ?? null;
  }, [state.clientType, state.holderAge, state.salary, availablePlanIds]);

  useEffect(() => {
    if (suggested && !state.selectedPlan) {
      setSelectedPlan(suggested);
    }
    // If current selection is not available for this client type, reset it
    if (state.selectedPlan && !availablePlanIds.includes(state.selectedPlan)) {
      setSelectedPlan(suggested ?? availablePlanIds[0]);
    }
  }, [suggested, state.selectedPlan, availablePlanIds, setSelectedPlan]);

  const plans = config.plans as Record<string, {
    id: string; name: string; coinsurance: boolean;
    pharmacyDiscount: number; internationType: string;
    complexStudies: boolean; description: string; tag: string;
  }>;

  const isMonotributo = state.clientType === "monotributo";
  const isPrepaid = state.clientType === "prepaid";

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
        {isMonotributo && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2">
            Para monotributo se muestra el <strong>precio final</strong> y el <strong>adicional a pagar</strong> por separado.
          </p>
        )}
        {isPrepaid && availablePlanIds.includes("SAJU500") && (
          <p className="text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 mt-2">
            Prepago Puro incluye el plan inicial <strong>SAJU500</strong>.
          </p>
        )}
        {!isPrepaid && (
          <p className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 mt-2 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            El plan SAJU500 no está disponible para este tipo de cliente.
          </p>
        )}
      </div>

      <div className="space-y-3">
        {availablePlanIds.map((planId) => {
          const plan = plans[planId];
          if (!plan) return null;

          const price = state.clientType && state.holderAge != null
            ? getPrice(state.clientType, state.holderAge, planId)
            : null;

          const adicional = isMonotributo && state.holderAge != null && state.monotributoCategory
            ? getMonotributoAdicional(state.holderAge, planId, state.monotributoCategory)
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
              <div className="flex flex-col items-end justify-between flex-shrink-0 gap-2">
                {price != null ? (
                  <div className={cn("text-right", isSelected ? "text-blue-800" : "text-gray-700")}>
                    {isMonotributo ? (
                      <>
                        <div className="text-xs text-gray-500 mb-0.5">Precio final</div>
                        <div className="text-sm font-bold">{formatCurrency(price)}</div>
                        {adicional != null && adicional > 0 && (
                          <div className="mt-1.5 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1 text-right">
                            <div className="text-xs text-amber-600">Adicional a pagar</div>
                            <div className="text-sm font-bold text-amber-700">{formatCurrency(adicional)}</div>
                          </div>
                        )}
                        {adicional === 0 && (
                          <div className="mt-1 text-xs text-emerald-600 font-medium">Sin adicional</div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="text-sm font-bold">{formatCurrency(price)}</div>
                        <div className="text-xs text-gray-400">/mes titular</div>
                      </>
                    )}
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
