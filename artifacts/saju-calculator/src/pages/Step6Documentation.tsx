import { useCalculator } from "@/context/CalculatorContext";
import { getRequiredDocuments } from "@/lib/calculator";
import type { DocumentStatus, RequiredDoc } from "@/lib/calculator";
import { CheckCircle2, AlertCircle, Clock, ChevronRight, Info, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS: { value: DocumentStatus["status"]; label: string; icon: React.ElementType; color: string }[] = [
  { value: "available", label: "Presentado",    icon: CheckCircle2, color: "text-emerald-600" },
  { value: "pending",   label: "Pendiente",     icon: Clock,        color: "text-amber-600"   },
  { value: "missing",   label: "Falta conseguir", icon: AlertCircle, color: "text-red-500"     },
];

export function Step6Documentation() {
  const { state, setDocumentStatus, setStep } = useCalculator();

  if (!state.clientType) return null;

  const allDocs = getRequiredDocuments(state.clientType, state.familyMembers);

  const warningDocs  = allDocs.filter((d) => d.warning);
  const regularDocs  = allDocs.filter((d) => !d.warning);

  const groups = regularDocs.reduce<Record<string, RequiredDoc[]>>((acc, doc) => {
    if (!acc[doc.group]) acc[doc.group] = [];
    acc[doc.group].push(doc);
    return acc;
  }, {});

  const getStatus = (docId: string): DocumentStatus["status"] => {
    return state.documentStatuses.find((d) => d.documentId === docId)?.status ?? "pending";
  };

  const totalDocs      = regularDocs.length;
  const availableCount = regularDocs.filter((d) => getStatus(d.id) === "available").length;
  const missingCount   = regularDocs.filter((d) => getStatus(d.id) === "missing").length;
  const pendingCount   = totalDocs - availableCount - missingCount;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="step-heading">Documentación requerida</h2>
        <p className="step-subheading">Marcá el estado de cada documento para llevar el control</p>
      </div>

      {warningDocs.length > 0 && (
        <div className="space-y-2">
          {warningDocs.map((doc) => (
            <div key={doc.id} className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-3.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-amber-800">{doc.name}</p>
                <p className="text-xs text-amber-700 mt-0.5">{doc.purpose}</p>
                <p className="text-xs text-amber-600 mt-1 italic">{doc.howToObtain}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Progress summary */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3.5 text-center">
          <div className="text-2xl font-black text-emerald-600">{availableCount}</div>
          <div className="text-xs font-semibold text-emerald-600 mt-0.5">Presentados</div>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3.5 text-center">
          <div className="text-2xl font-black text-amber-500">{pendingCount}</div>
          <div className="text-xs font-semibold text-amber-600 mt-0.5">Pendientes</div>
        </div>
        <div className="bg-red-50 border border-red-100 rounded-xl p-3.5 text-center">
          <div className="text-2xl font-black text-red-500">{missingCount}</div>
          <div className="text-xs font-semibold text-red-500 mt-0.5">Faltan</div>
        </div>
      </div>

      {/* Document groups */}
      {Object.entries(groups).map(([group, docs]) => (
        <div key={group} className="space-y-2">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">{group}</h3>
          {docs.map((doc) => {
            const status = getStatus(doc.id);
            return (
              <div
                key={doc.id}
                className={cn(
                  "rounded-xl border p-4 transition-all",
                  status === "available" && "border-emerald-200 bg-emerald-50/70",
                  status === "pending"   && "border-slate-200 bg-white",
                  status === "missing"   && "border-red-200 bg-red-50/70"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-slate-800">{doc.name}</span>
                      {doc.required ? (
                        <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-medium">Requerido</span>
                      ) : (
                        <span className="text-xs bg-sky-50 text-sky-600 px-1.5 py-0.5 rounded font-medium">Opcional</span>
                      )}
                      {doc.critical && (
                        <span className="text-xs bg-red-100 text-red-600 font-bold px-1.5 py-0.5 rounded">CRÍTICO</span>
                      )}
                      {doc.condition === "no_clave_fiscal" && (
                        <span className="text-xs bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded border border-amber-200">Solo si no tiene Clave Fiscal</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{doc.purpose}</p>
                    <div className="flex items-start gap-1.5 mt-2.5 bg-sky-50 border border-sky-100 rounded-lg p-2.5">
                      <Info className="w-3.5 h-3.5 text-sky-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-sky-700 leading-relaxed">Cómo obtenerlo: {doc.howToObtain}</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  {STATUS_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    const isSelected = status === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setDocumentStatus(doc.id, opt.value)}
                        className={cn(
                          "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold border-2 transition-all",
                          isSelected
                            ? opt.value === "available"
                              ? "border-emerald-500 bg-emerald-500 text-white"
                              : opt.value === "missing"
                                ? "border-red-500 bg-red-500 text-white"
                                : "border-amber-500 bg-amber-500 text-white"
                            : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                        )}
                      >
                        <Icon className="w-3 h-3" />
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ))}

      <button
        onClick={() => setStep(7)}
        className="w-full py-4 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-sm shadow-sky-200/60"
      >
        Ver resumen final <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
