import { useCalculator } from "@/context/CalculatorContext";
import {
  calculateTotal,
  formatCurrency,
  getFamilyMemberLabel,
  getRequiredDocuments,
  calculateCapacity,
  getDependencyPlanPrice,
  getDependencyDifference,
  getDependencySaldoAFavor,
} from "@/lib/calculator";
import type { DocumentStatus, MemberPriceResult, PlanId, RequiredDoc } from "@/lib/calculator";
import { CheckCircle2, AlertCircle, Clock, RotateCcw, ChevronDown, ChevronUp, AlertTriangle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import config from "@/data/saju-config.json";

const CLIENT_TYPE_LABELS: Record<string, string> = {
  dependency: "Relación de Dependencia",
  monotributo: "Monotributista",
  prepaid: "Prepago Puro",
};

const STATUS_ICONS: Record<DocumentStatus["status"], { icon: React.ElementType; color: string; label: string }> = {
  available: { icon: CheckCircle2, color: "text-emerald-600", label: "Presentado" },
  pending: { icon: Clock, color: "text-amber-600", label: "Pendiente" },
  missing: { icon: AlertCircle, color: "text-red-500", label: "Falta conseguir" },
};

export function Step7Summary() {
  const { state, resetAll } = useCalculator();
  const [showNextSteps, setShowNextSteps] = useState(false);
  const [showFaq, setShowFaq] = useState(false);

  if (!state.clientType || !state.holderAge || !state.selectedPlan) return null;

  const planId = state.selectedPlan as PlanId;
  const plans = config.plans as Record<string, { id: string; name: string; pharmacyDiscount: number; tag: string }>;
  const plan = plans[planId];

  const isDependency = state.clientType === "dependency";
  const isMonotributo = state.clientType === "monotributo";

  const { holderPrice, memberPrices, total } = calculateTotal(
    state.clientType,
    state.holderAge,
    planId,
    state.familyMembers,
    state.monotributoCategory,
    state.salary
  );

  // For dependency: plan price + diferencia que paga el empleado
  const dependencyPlanPrice = isDependency
    ? getDependencyPlanPrice(planId, state.holderAge)
    : null;
  const capacity = isDependency && state.salary != null
    ? calculateCapacity(state.salary)
    : null;
  const dependencyDifference = isDependency && state.salary != null
    ? getDependencyDifference(state.salary, planId, state.holderAge)
    : null;
  const dependencySaldo = isDependency && state.salary != null
    ? getDependencySaldoAFavor(state.salary, planId, state.holderAge)
    : null;

  const allDocs = getRequiredDocuments(state.clientType, state.familyMembers);
  const regularDocs = allDocs.filter((d) => !d.warning);
  const warningDocs = allDocs.filter((d) => d.warning);

  const getStatus = (docId: string): DocumentStatus["status"] => {
    return state.documentStatuses.find((d) => d.documentId === docId)?.status ?? "pending";
  };

  const availableDocs = regularDocs.filter((d) => getStatus(d.id) === "available");
  const pendingDocs = regularDocs.filter((d) => getStatus(d.id) === "pending");
  const missingDocs = regularDocs.filter((d) => getStatus(d.id) === "missing");

  const faq = config.faq as Array<{ id: string; question: string; answer: string }>;
  const nextSteps = config.nextSteps as Array<{ step: number; title: string; description: string }>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="step-heading">Resumen del caso</h2>
        <button
          onClick={resetAll}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-sky-600 transition-colors px-2 py-1.5 rounded-lg hover:bg-slate-100"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Nuevo caso
        </button>
      </div>

      {/* Plan + client info */}
      <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
        <div className="bg-gradient-to-r from-sky-700 to-sky-600 px-5 py-4">
          <p className="text-xs font-bold text-sky-200 uppercase tracking-widest">Plan seleccionado</p>
          <p className="text-xl font-black text-white mt-1 tracking-tight">{planId} — {plan?.name}</p>
        </div>
        <div className="p-5 space-y-3">
          <SummaryRow label="Tipo de cliente" value={CLIENT_TYPE_LABELS[state.clientType]} />
          <SummaryRow label="Edad del titular" value={`${state.holderAge} años`} />
          {state.salary != null && (
            <>
              <SummaryRow label="Sueldo bruto" value={formatCurrency(state.salary)} />
              {capacity != null && (
                <SummaryRow label="Capacidad de pago" value={`${formatCurrency(capacity)}/mes`} />
              )}
            </>
          )}
          {state.monotributoCategory && (
            <SummaryRow label="Categoría AFIP" value={`Categoría ${state.monotributoCategory}`} />
          )}
        </div>
      </div>

      {/* Cost breakdown */}
      <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Desglose de costos</p>
          {isDependency && (
            <span className="text-xs text-sky-700 bg-sky-50 border border-sky-200 rounded-lg px-2.5 py-1 font-semibold">
              Relación de Dependencia
            </span>
          )}
          {isMonotributo && (
            <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1 font-semibold">
              Titular: solo adicional
            </span>
          )}
        </div>
        <div className="p-5">
          <div className="space-y-3">
            {/* Holder row */}
            {isDependency ? (
              <DependencyHolderRow
                holderAge={state.holderAge}
                planPrice={dependencyPlanPrice}
                capacity={capacity}
                diferencia={dependencyDifference}
                saldoAFavor={state.familyMembers.length > 0 ? dependencySaldo : null}
              />
            ) : (
              <PersonCostRow
                label="Titular"
                sublabel={`${state.holderAge} años`}
                price={holderPrice}
                isMonotributoHolder={isMonotributo}
              />
            )}

            {/* Member rows */}
            {memberPrices.map(({ member, price, aporteMTPart, adicionalPart, fullMemberPrice, saldoAplicado }: MemberPriceResult) =>
              isDependency ? (
                <DependencyMemberRow key={member.id} member={member} price={price} fullMemberPrice={fullMemberPrice} saldoAplicado={saldoAplicado} />
              ) : (
                <PersonCostRow
                  key={member.id}
                  label={member.name || getFamilyMemberLabel(member.type)}
                  sublabel={`${member.age} años · ${getFamilyMemberLabel(member.type)}`}
                  price={price}
                  aporteMTPart={aporteMTPart}
                  adicionalPart={adicionalPart}
                />
              )
            )}
          </div>

          {/* Total (only for non-dependency) */}
          {!isDependency && total != null && (
            <div className="mt-4 bg-sky-600 rounded-xl px-5 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-sky-200 uppercase tracking-widest">Total mensual</p>
                  <p className="text-xs text-sky-200 mt-0.5">
                    {state.familyMembers.length > 0
                      ? `Titular + ${state.familyMembers.length} familiar${state.familyMembers.length > 1 ? "es" : ""}`
                      : "Solo titular"}
                  </p>
                </div>
                <span className="text-3xl font-bold text-white">{formatCurrency(total)}</span>
              </div>
              {isMonotributo && (
                <p className="text-xs text-sky-200 mt-2 pt-2 border-t border-sky-500">
                  Titular: adicional · Integrantes: aporte AFIP + adicional
                </p>
              )}
            </div>
          )}

          {/* Dependency: total mensual */}
          {isDependency && total != null && (
            <div className="mt-4 bg-sky-600 rounded-xl px-5 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-sky-200 uppercase tracking-widest">Total mensual</p>
                  <p className="text-xs text-sky-200 mt-0.5">
                    {state.familyMembers.length > 0
                      ? `Titular + ${state.familyMembers.length} familiar${state.familyMembers.length > 1 ? "es" : ""}`
                      : "Solo titular"}
                  </p>
                </div>
                <span className="text-3xl font-bold text-white">{formatCurrency(total)}</span>
              </div>
            </div>
          )}
          {isDependency && total == null && (
            <div className="mt-4 rounded-xl overflow-hidden border border-sky-100">
              <div className="bg-sky-50 px-4 py-3.5 space-y-1.5">
                <p className="text-xs font-semibold text-sky-800">Relación de Dependencia</p>
                <p className="text-xs text-sky-700">
                  Ingresá el sueldo bruto para calcular la diferencia que paga el empleado.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Warning notices */}
      {warningDocs.length > 0 && (
        <div className="space-y-2">
          {warningDocs.map((doc) => (
            <div key={doc.id} className="flex items-start gap-3 bg-amber-50 border border-amber-300 rounded-xl p-3">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-amber-800">{doc.name}</p>
                <p className="text-xs text-amber-700 mt-0.5">{doc.purpose}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Documentation status */}
      <div className="space-y-3">
        {missingDocs.length > 0 && (
          <DocSection title="Documentación faltante" docs={missingDocs} statusKey="missing" variant="danger" />
        )}
        {pendingDocs.length > 0 && (
          <DocSection title="Documentación pendiente" docs={pendingDocs} statusKey="pending" variant="warning" />
        )}
        {availableDocs.length > 0 && (
          <DocSection title="Documentación presentada" docs={availableDocs} statusKey="available" variant="success" />
        )}
      </div>

      {/* Next steps */}
      <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-sm">
        <button
          onClick={() => setShowNextSteps((v) => !v)}
          className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition-colors"
        >
          <span className="font-semibold text-sm text-gray-800">Próximos pasos del proceso</span>
          {showNextSteps ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </button>
        {showNextSteps && (
          <div className="px-5 pb-5 space-y-3 border-t border-slate-100">
            {nextSteps?.map((step) => (
              <div key={step.step} className="flex gap-3 pt-3">
                <div className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {step.step}
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-800">{step.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FAQ */}
      <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-sm">
        <button
          onClick={() => setShowFaq((v) => !v)}
          className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition-colors"
        >
          <span className="font-semibold text-sm text-gray-800">Preguntas frecuentes</span>
          {showFaq ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </button>
        {showFaq && (
          <div className="divide-y divide-slate-100 border-t border-slate-100">
            {faq.map((item) => (
              <FaqItem key={item.id} question={item.question} answer={item.answer} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold text-slate-800">{value}</span>
    </div>
  );
}

/** Row for dependency holder — shows plan price, employer discount, diferencia, and saldo a favor */
function DependencyHolderRow({
  holderAge,
  planPrice,
  capacity,
  diferencia,
  saldoAFavor,
}: {
  holderAge: number;
  planPrice: number | null;
  capacity: number | null;
  diferencia: number | null;
  saldoAFavor?: number | null;
}) {
  return (
    <div className="flex items-start justify-between gap-2 py-2 border-b border-gray-100">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-gray-800">Titular</p>
        <p className="text-xs text-gray-500">{holderAge} años · Relación de Dependencia</p>
        {planPrice != null && (
          <p className="text-xs text-gray-400 mt-0.5">Precio plan: {formatCurrency(planPrice)}</p>
        )}
        {capacity != null && (
          <p className="text-xs text-gray-400">Descuento empleador: {formatCurrency(capacity)}</p>
        )}
        {saldoAFavor != null && saldoAFavor > 0 && (
          <p className="text-xs text-emerald-600 font-medium">Saldo a favor: {formatCurrency(saldoAFavor)}</p>
        )}
      </div>
      <div className="text-right flex-shrink-0">
        {diferencia === null && (
          <span className="text-xs text-gray-400 italic">Sin sueldo ingresado</span>
        )}
        {diferencia === 0 && (
          <div className="flex items-center gap-1 text-emerald-600 justify-end">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-semibold">Cubierto</span>
          </div>
        )}
        {diferencia != null && diferencia > 0 && (
          <div>
            <p className="text-xs text-amber-600">Diferencia a pagar</p>
            <p className="text-sm font-bold text-amber-700">{formatCurrency(diferencia)}</p>
          </div>
        )}
      </div>
    </div>
  );
}

/** Row for dependency family member — shows plan price, saldo applied, and effective cost */
function DependencyMemberRow({
  member,
  price,
  fullMemberPrice,
  saldoAplicado,
}: {
  member: MemberPriceResult["member"];
  price: number | null;
  fullMemberPrice?: number | null;
  saldoAplicado?: number | null;
}) {
  return (
    <div className="flex items-start justify-between gap-2 py-2 border-b border-gray-100 last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-gray-800">
          {member.name || getFamilyMemberLabel(member.type)}
        </p>
        <p className="text-xs text-gray-500">{member.age} años · {getFamilyMemberLabel(member.type)}</p>
        {fullMemberPrice != null && (
          <p className="text-xs text-gray-400 mt-0.5">Precio plan: {formatCurrency(fullMemberPrice)}</p>
        )}
        {saldoAplicado != null && saldoAplicado > 0 && (
          <p className="text-xs text-emerald-600">Saldo a favor: −{formatCurrency(saldoAplicado)}</p>
        )}
      </div>
      <div className="text-right flex-shrink-0">
        {price != null ? (
          <span className="text-sm font-bold text-gray-900">{formatCurrency(price)}</span>
        ) : (
          <span className="text-xs text-gray-400 italic">Sin sueldo ingresado</span>
        )}
      </div>
    </div>
  );
}

/**
 * Generic cost row for monotributo and prepaid.
 *
 * Monotributo titular:  isMonotributoHolder=true → shows "Pagás $X (adicional)"
 * Monotributo member:   aporteMTPart + adicionalPart → shows breakdown
 * Prepaid:              price shown normally
 */
function PersonCostRow({
  label,
  sublabel,
  price,
  isMonotributoHolder,
  aporteMTPart,
  adicionalPart,
}: {
  label: string;
  sublabel: string;
  price: number | null;
  isMonotributoHolder?: boolean;
  aporteMTPart?: number | null;
  adicionalPart?: number | null;
}) {
  const hasMonotributoBreakdown = aporteMTPart != null && adicionalPart != null;

  return (
    <div className="flex items-start justify-between gap-2 py-2 border-b border-gray-100 last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-gray-800">{label}</p>
        <p className="text-xs text-gray-500">{sublabel}</p>
        {hasMonotributoBreakdown && (
          <div className="mt-1 text-xs text-gray-400 space-y-0.5">
            <span className="block">Aporte AFIP: <strong className="text-gray-600">{formatCurrency(aporteMTPart)}</strong></span>
            <span className="block">Adicional: <strong className="text-amber-700">{formatCurrency(adicionalPart)}</strong></span>
          </div>
        )}
      </div>
      <div className="text-right flex-shrink-0">
        {price != null ? (
          <>
            <p className="text-sm font-bold text-gray-900">{formatCurrency(price)}</p>
            {isMonotributoHolder && (
              <p className="text-xs text-amber-600 mt-0.5">adicional sobre monotributo</p>
            )}
            {hasMonotributoBreakdown && (
              <p className="text-xs text-gray-400 mt-0.5">aporte + adicional</p>
            )}
          </>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        )}
      </div>
    </div>
  );
}

function DocSection({
  title,
  docs,
  statusKey,
  variant,
}: {
  title: string;
  docs: RequiredDoc[];
  statusKey: DocumentStatus["status"];
  variant: "success" | "warning" | "danger";
}) {
  const statusInfo = STATUS_ICONS[statusKey];
  const Icon = statusInfo.icon;
  const bgColor = variant === "success" ? "bg-emerald-50 border-emerald-100" : variant === "warning" ? "bg-amber-50 border-amber-100" : "bg-red-50/70 border-red-100";
  const titleColor = variant === "success" ? "text-emerald-700" : variant === "warning" ? "text-amber-700" : "text-red-600";

  return (
    <div className={cn("border rounded-xl p-4 space-y-2", bgColor)}>
      <div className="flex items-center gap-2">
        <Icon className={cn("w-4 h-4", statusInfo.color)} />
        <span className={cn("text-xs font-bold uppercase tracking-wider", titleColor)}>{title}</span>
        <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", titleColor, bgColor, "border", variant === "success" ? "border-emerald-200" : variant === "warning" ? "border-amber-200" : "border-red-200")}>
          {docs.length}
        </span>
      </div>
      <div className="space-y-1.5">
        {docs.map((doc) => (
          <div key={doc.id} className="flex items-start gap-2">
            <div className="w-1 h-1 rounded-full bg-current flex-shrink-0 mt-1.5" />
            <span className="text-xs text-gray-700">
              {doc.name}
              {doc.critical && <span className="ml-1.5 text-red-600 font-semibold">(CRÍTICO)</span>}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="px-5 py-3.5">
      <button
        className="w-full flex items-start justify-between gap-2 text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="text-sm font-semibold text-slate-800">{question}</span>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" /> : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />}
      </button>
      {open && (
        <div className="mt-2.5 bg-sky-50 border border-sky-100 rounded-xl p-3.5">
          <p className="text-xs text-slate-700 leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
}
