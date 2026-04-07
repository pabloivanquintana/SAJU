import { useMemo, useEffect } from "react";
import { useCalculator } from "@/context/CalculatorContext";
import {
  getHolderPrice,
  getDependencyPlanPrice,
  getDependencyDifference,
  calculateCapacity,
  getMonotributoAdicional,
  suggestPlan,
  formatCurrency,
} from "@/lib/calculator";
import type { PlanId } from "@/lib/calculator";
import { Check, ChevronRight, Stethoscope, Pill, Hospital, Microscope, AlertTriangle, CheckCircle2 } from "lucide-react";
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
    return availablePlanIds.includes(s) ? s : availablePlanIds[0] ?? null;
  }, [state.clientType, state.holderAge, state.salary, availablePlanIds]);

  useEffect(() => {
    if (suggested && !state.selectedPlan) {
      setSelectedPlan(suggested);
    }
    if (state.selectedPlan && !availablePlanIds.includes(state.selectedPlan)) {
      setSelectedPlan(suggested ?? availablePlanIds[0]);
    }
  }, [suggested, state.selectedPlan, availablePlanIds, setSelectedPlan]);

  const plans = config.plans as Record<string, {
    id: string; name: string; coinsurance: boolean;
    pharmacyDiscount: number; internationType: string;
    complexStudies: boolean; description: string; tag: string;
  }>;

  const isDependency = state.clientType === "dependency";
  const isMonotributo = state.clientType === "monotributo";
  const isPrepaid = state.clientType === "prepaid";

  const capacity = isDependency && state.salary != null
    ? calculateCapacity(state.salary)
    : null;

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

        {isDependency && capacity != null && (
          <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs text-blue-700">
            Descuento empleador: <strong>{formatCurrency(capacity)}/mes</strong>.
            {" "}La diferencia es lo que abona el empleado.
          </div>
        )}
        {isDependency && capacity == null && (
          <div className="mt-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-500">
            Ingresá el sueldo bruto para ver la diferencia que paga el empleado.
          </div>
        )}
        {isMonotributo && (
          <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700">
            Para monotributo se muestra el <strong>adicional a pagar</strong> (el titular ya aporta al plan por AFIP).
          </div>
        )}
        {isPrepaid && availablePlanIds.includes("SAJU500") && (
          <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs text-blue-700">
            Prepago Puro incluye el plan inicial <strong>SAJU500</strong>.
          </div>
        )}
        {!isPrepaid && (
          <div className="mt-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-500 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            El plan SAJU500 no está disponible para este tipo de cliente.
          </div>
        )}
      </div>

      <div className="space-y-3">
        {availablePlanIds.map((planId) => {
          const plan = plans[planId];
          if (!plan) return null;

          const isSelected = state.selectedPlan === planId;
          const isSuggested = planId === suggested;

          // ── Dependency: plan price + diferencia que paga el empleado ─────
          const planPrice = isDependency && state.holderAge != null
            ? getDependencyPlanPrice(planId, state.holderAge)
            : null;
          const diferencia = isDependency && state.salary != null && state.holderAge != null
            ? getDependencyDifference(state.salary, planId, state.holderAge)
            : null;

          // ── Monotributo: titular pays ADICIONAL only ─────────────────────
          const adicional = isMonotributo && state.holderAge != null && state.monotributoCategory
            ? getMonotributoAdicional(state.holderAge, planId, state.monotributoCategory)
            : null;

          // ── Prepaid: direct price ─────────────────────────────────────────
          const prepaidPrice = isPrepaid && state.holderAge != null
            ? getHolderPrice("prepaid", state.holderAge, planId)
            : null;

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

              <div className="flex flex-col items-end justify-between flex-shrink-0 gap-2 min-w-[90px]">
                {/* Dependency: show plan price + diferencia */}
                {isDependency && planPrice != null && (
                  <div className="text-right space-y-0.5">
                    <p className="text-xs text-gray-400">Precio plan</p>
                    <p className={cn("text-sm font-bold", isSelected ? "text-blue-800" : "text-gray-700")}>
                      {formatCurrency(planPrice)}
                    </p>
                    {diferencia !== null && (
                      diferencia === 0 ? (
                        <div className="mt-1 flex items-center gap-1 justify-end text-emerald-600">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span className="text-xs font-semibold">Cubierto</span>
                        </div>
                      ) : (
                        <div className="mt-1 text-right">
                          <p className="text-xs text-amber-600">Diferencia</p>
                          <p className="text-sm font-bold text-amber-700">{formatCurrency(diferencia)}</p>
                        </div>
                      )
                    )}
                  </div>
                )}
                {isDependency && planPrice == null && (
                  <span className="text-xs text-gray-400">—</span>
                )}

                {/* Monotributo: show adicional only */}
                {isMonotributo && (
                  <div className="text-right">
                    {adicional != null ? (
                      <>
                        <p className="text-xs text-amber-600 mb-0.5">Adicional a pagar</p>
                        <p className={cn("text-sm font-bold", isSelected ? "text-amber-700" : "text-amber-600")}>
                          {formatCurrency(adicional)}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">/mes titular</p>
                      </>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </div>
                )}

                {/* Prepaid: direct price */}
                {isPrepaid && (
                  <div className="text-right">
                    {prepaidPrice != null ? (
                      <>
                        <p className={cn("text-sm font-bold", isSelected ? "text-blue-800" : "text-gray-700")}>
                          {formatCurrency(prepaidPrice)}
                        </p>
                        <p className="text-xs text-gray-400">/mes titular</p>
                      </>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </div>
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
