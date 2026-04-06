import { useCalculator } from "@/context/CalculatorContext";
import { getRequiredDocuments } from "@/lib/calculator";
import type { DocumentStatus } from "@/lib/calculator";
import { CheckCircle2, AlertCircle, Clock, ChevronRight, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS: { value: DocumentStatus["status"]; label: string; icon: React.ElementType; color: string }[] = [
  { value: "available", label: "Presentado", icon: CheckCircle2, color: "text-emerald-600" },
  { value: "pending", label: "Pendiente", icon: Clock, color: "text-amber-600" },
  { value: "missing", label: "Falta conseguir", icon: AlertCircle, color: "text-red-500" },
];

export function Step6Documentation() {
  const { state, setDocumentStatus, setStep } = useCalculator();

  if (!state.clientType) return null;

  const requiredDocs = getRequiredDocuments(state.clientType, state.familyMembers);

  const groups = requiredDocs.reduce<Record<string, typeof requiredDocs>>((acc, doc) => {
    if (!acc[doc.group]) acc[doc.group] = [];
    acc[doc.group].push(doc);
    return acc;
  }, {});

  const getStatus = (docId: string): DocumentStatus["status"] => {
    return state.documentStatuses.find((d) => d.documentId === docId)?.status ?? "pending";
  };

  const totalDocs = requiredDocs.length;
  const availableCount = requiredDocs.filter((d) => getStatus(d.id) === "available").length;
  const missingCount = requiredDocs.filter((d) => getStatus(d.id) === "missing").length;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Documentación requerida</h2>
        <p className="text-sm text-gray-500 mt-1">Marcá el estado de cada documento para llevar el control</p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-emerald-600">{availableCount}</div>
          <div className="text-xs text-emerald-600">Presentados</div>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-amber-600">{totalDocs - availableCount - missingCount}</div>
          <div className="text-xs text-amber-600">Pendientes</div>
        </div>
        <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-red-500">{missingCount}</div>
          <div className="text-xs text-red-500">Faltan</div>
        </div>
      </div>

      {Object.entries(groups).map(([group, docs]) => (
        <div key={group} className="space-y-2">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">{group}</h3>
          {docs.map((doc) => {
            const status = getStatus(doc.id);
            return (
              <div
                key={doc.id}
                className={cn(
                  "rounded-xl border p-4 transition-all",
                  status === "available" && "border-emerald-200 bg-emerald-50",
                  status === "pending" && "border-gray-200 bg-white",
                  status === "missing" && "border-red-200 bg-red-50"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-gray-900">{doc.name}</span>
                      {doc.required ? (
                        <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">Requerido</span>
                      ) : (
                        <span className="text-xs bg-blue-50 text-blue-500 px-1.5 py-0.5 rounded">Opcional</span>
                      )}
                      {doc.critical && (
                        <span className="text-xs bg-red-100 text-red-600 font-semibold px-1.5 py-0.5 rounded">CRÍTICO</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{doc.purpose}</p>
                    <div className="flex items-start gap-1.5 mt-2 bg-blue-50 rounded-lg p-2">
                      <Info className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-blue-700">Cómo obtenerlo: {doc.howToObtain}</p>
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
                          "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold border-2 transition-all",
                          isSelected
                            ? opt.value === "available"
                              ? "border-emerald-500 bg-emerald-500 text-white"
                              : opt.value === "missing"
                                ? "border-red-500 bg-red-500 text-white"
                                : "border-amber-500 bg-amber-500 text-white"
                            : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
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
        className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-sm shadow-blue-200"
      >
        Ver resumen final <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
