import { useState, useEffect } from "react";
import { useCalculator } from "@/context/CalculatorContext";
import { calculateCapacity, formatCurrency } from "@/lib/calculator";
import { ChevronRight, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import config from "@/data/saju-config.json";

const CATEGORIES = config.clientTypes.monotributo.categories;

export function Step3EconomicData() {
  const { state, setSalary, setMonotributoCategory, setStep } = useCalculator();

  const [salaryInput, setSalaryInput] = useState(state.salary?.toString() ?? "");
  const [selectedCategory, setSelectedCategory] = useState(state.monotributoCategory ?? "");

  useEffect(() => {
    if (state.clientType === "prepaid") {
      setStep(4);
    }
  }, [state.clientType, setStep]);

  if (state.clientType === "prepaid") return null;

  function handleContinue() {
    if (state.clientType === "dependency") {
      const val = parseFloat(salaryInput.replace(/\./g, "").replace(",", "."));
      if (isNaN(val) || val <= 0) return;
      setSalary(val);
    } else if (state.clientType === "monotributo") {
      if (!selectedCategory) return;
      setMonotributoCategory(selectedCategory);
    }
    setTimeout(() => setStep(4), 150);
  }

  const salary = parseFloat(salaryInput.replace(/\./g, "").replace(",", "."));
  const capacity = !isNaN(salary) && salary > 0 ? calculateCapacity(salary) : null;

  const canContinue =
    state.clientType === "dependency"
      ? !isNaN(salary) && salary > 0
      : !!selectedCategory;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="step-heading">
          {state.clientType === "dependency" ? "¿Cuál es el sueldo bruto mensual?" : "¿Cuál es la categoría AFIP?"}
        </h2>
        <p className="step-subheading">
          {state.clientType === "dependency"
            ? "Se usa para calcular la capacidad de pago estimada"
            : "La categoría determina el precio del plan"}
        </p>
      </div>

      {state.clientType === "dependency" && (
        <div className="space-y-4">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-300">$</span>
            <input
              type="text"
              inputMode="numeric"
              value={salaryInput}
              onChange={(e) => setSalaryInput(e.target.value.replace(/[^0-9,.]/g, ""))}
              onKeyDown={(e) => e.key === "Enter" && handleContinue()}
              placeholder="0"
              className="w-full text-3xl font-bold pl-10 pr-4 py-5 rounded-2xl border-2 border-slate-200 bg-slate-50 focus:border-sky-400 focus:bg-white focus:shadow-sm focus:shadow-sky-100 outline-none transition-all text-right text-slate-800 placeholder:text-slate-200"
              autoFocus
            />
          </div>

          {capacity != null && (
            <div className="bg-sky-50 border border-sky-100 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-sky-700">
                <Info className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm font-semibold">Capacidad de pago estimada</span>
              </div>
              <div className="text-2xl font-bold text-sky-800">{formatCurrency(capacity)}<span className="text-sm font-medium text-sky-500 ml-1">/mes</span></div>
              <p className="text-xs text-sky-600">
                {formatCurrency(salary)} × 3% × 3 = {formatCurrency(capacity)}
              </p>
            </div>
          )}
        </div>
      )}

      {state.clientType === "monotributo" && (
        <div className="space-y-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Categoría AFIP del monotributista</p>
          <div className="grid grid-cols-4 gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "py-3.5 rounded-xl border-2 font-bold text-lg transition-all",
                  selectedCategory === cat
                    ? "border-sky-500 bg-sky-600 text-white shadow-sm shadow-sky-200"
                    : "border-slate-200 bg-white text-slate-700 hover:border-sky-300 hover:bg-sky-50"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
          {selectedCategory && (
            <div className="flex items-start gap-2 text-sky-700 bg-sky-50 border border-sky-100 rounded-xl p-3.5 text-sm">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>Categoría <strong>{selectedCategory}</strong> seleccionada. El precio se calculará según esta categoría y la edad del titular.</span>
            </div>
          )}
        </div>
      )}

      <button
        onClick={handleContinue}
        disabled={!canContinue}
        className={cn(
          "w-full py-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all",
          canContinue
            ? "bg-sky-600 hover:bg-sky-700 text-white shadow-sm shadow-sky-200/60"
            : "bg-slate-100 text-slate-400 cursor-not-allowed"
        )}
      >
        Continuar <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
