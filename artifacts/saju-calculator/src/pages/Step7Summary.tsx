import { useCalculator } from "@/context/CalculatorContext";
import { calculateTotal, formatCurrency, getFamilyMemberLabel, getRequiredDocuments } from "@/lib/calculator";
import type { DocumentStatus, PlanId } from "@/lib/calculator";
import { CheckCircle2, AlertCircle, Clock, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";
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

  const { holderPrice, memberPrices, total } = calculateTotal(
    state.clientType,
    state.holderAge,
    planId,
    state.familyMembers,
    state.monotributoCategory
  );

  const requiredDocs = getRequiredDocuments(state.clientType, state.familyMembers);

  const getStatus = (docId: string): DocumentStatus["status"] => {
    return state.documentStatuses.find((d) => d.documentId === docId)?.status ?? "pending";
  };

  const availableDocs = requiredDocs.filter((d) => getStatus(d.id) === "available");
  const pendingDocs = requiredDocs.filter((d) => getStatus(d.id) === "pending");
  const missingDocs = requiredDocs.filter((d) => getStatus(d.id) === "missing");

  const faq = config.faq as Array<{ id: string; question: string; answer: string }>;
  const nextSteps = config.nextSteps as Array<{ step: number; title: string; description: string }>;

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Resumen del caso</h2>
          <button
            onClick={resetAll}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors px-2 py-1.5 rounded-lg hover:bg-gray-100"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Nuevo caso
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="bg-blue-600 px-4 py-3">
          <p className="text-xs font-semibold text-blue-200 uppercase tracking-wider">Plan seleccionado</p>
          <p className="text-lg font-bold text-white mt-0.5">{planId} — {plan?.name}</p>
        </div>
        <div className="p-4 space-y-3">
          <SummaryRow label="Tipo de cliente" value={CLIENT_TYPE_LABELS[state.clientType]} />
          <SummaryRow label="Edad del titular" value={`${state.holderAge} años`} />
          {state.salary != null && (
            <SummaryRow label="Sueldo bruto" value={formatCurrency(state.salary)} />
          )}
          {state.monotributoCategory && (
            <SummaryRow label="Categoría AFIP" value={`Categoría ${state.monotributoCategory}`} />
          )}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Desglose de costos</p>
        </div>
        <div className="p-4 space-y-2">
          <CostRow label={`Titular (${state.holderAge} años)`} price={holderPrice} />
          {memberPrices.map(({ member, price }) => (
            <CostRow
              key={member.id}
              label={`${member.name || getFamilyMemberLabel(member.type)} (${member.age} años)`}
              price={price}
              tag={getFamilyMemberLabel(member.type)}
            />
          ))}
          {total != null && (
            <>
              <div className="border-t border-gray-200 pt-3 mt-3" />
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-900">TOTAL MENSUAL</span>
                <span className="text-2xl font-bold text-blue-700">{formatCurrency(total)}</span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {missingDocs.length > 0 && (
          <DocSection
            title="Documentación faltante"
            docs={missingDocs}
            statusKey="missing"
            variant="danger"
          />
        )}
        {pendingDocs.length > 0 && (
          <DocSection
            title="Documentación pendiente"
            docs={pendingDocs}
            statusKey="pending"
            variant="warning"
          />
        )}
        {availableDocs.length > 0 && (
          <DocSection
            title="Documentación presentada"
            docs={availableDocs}
            statusKey="available"
            variant="success"
          />
        )}
      </div>

      <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
        <button
          onClick={() => setShowNextSteps((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
        >
          <span className="font-semibold text-sm text-gray-800">Próximos pasos del proceso</span>
          {showNextSteps ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </button>
        {showNextSteps && (
          <div className="px-4 pb-4 space-y-3 border-t border-gray-100">
            {nextSteps.map((step) => (
              <div key={step.step} className="flex gap-3 pt-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
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

      <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
        <button
          onClick={() => setShowFaq((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
        >
          <span className="font-semibold text-sm text-gray-800">Preguntas frecuentes</span>
          {showFaq ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </button>
        {showFaq && (
          <div className="divide-y divide-gray-100 border-t border-gray-100">
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
      <span className="text-gray-500">{label}</span>
      <span className="font-semibold text-gray-800">{value}</span>
    </div>
  );
}

function CostRow({ label, price, tag }: { label: string; price: number | null; tag?: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-gray-700">{label}</span>
        {tag && <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{tag}</span>}
      </div>
      <span className="font-semibold text-gray-800">
        {price != null ? formatCurrency(price) : "—"}
      </span>
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
  docs: Array<{ id: string; name: string; purpose: string; critical?: boolean }>;
  statusKey: DocumentStatus["status"];
  variant: "success" | "warning" | "danger";
}) {
  const statusInfo = STATUS_ICONS[statusKey];
  const Icon = statusInfo.icon;
  const bgColor = variant === "success" ? "bg-emerald-50 border-emerald-100" : variant === "warning" ? "bg-amber-50 border-amber-100" : "bg-red-50 border-red-100";
  const titleColor = variant === "success" ? "text-emerald-700" : variant === "warning" ? "text-amber-700" : "text-red-700";

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
          <div key={doc.id} className="flex items-center gap-2">
            <div className="w-1 h-1 rounded-full bg-current flex-shrink-0 mt-0.5" />
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
    <div className="px-4 py-3">
      <button
        className="w-full flex items-start justify-between gap-2 text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="text-sm font-semibold text-gray-800">{question}</span>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />}
      </button>
      {open && (
        <p className="text-xs text-gray-600 mt-2 leading-relaxed">{answer}</p>
      )}
    </div>
  );
}
