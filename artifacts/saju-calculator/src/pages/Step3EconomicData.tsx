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
        <h2 className="text-xl font-bold text-gray-900">
          {state.clientType === "dependency" ? "¿Cuál es el sueldo bruto mensual?" : "¿Cuál es la categoría AFIP?"}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {state.clientType === "dependency"
            ? "Se usa para calcular la capacidad de pago estimada"
            : "La categoría determina el precio del plan"}
        </p>
      </div>

      {state.clientType === "dependency" && (
        <div className="space-y-4">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-gray-400">$</span>
            <input
              type="text"
              inputMode="numeric"
              value={salaryInput}
              onChange={(e) => setSalaryInput(e.target.value.replace(/[^0-9,.]/g, ""))}
              onKeyDown={(e) => e.key === "Enter" && handleContinue()}
              placeholder="0"
              className="w-full text-3xl font-bold pl-10 pr-4 py-5 rounded-xl border-2 border-gray-200 bg-gray-50 focus:border-blue-400 focus:bg-white outline-none transition-all text-right text-gray-900 placeholder:text-gray-300"
              autoFocus
            />
          </div>

          {capacity != null && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-blue-700">
                <Info className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm font-semibold">Capacidad de pago estimada</span>
              </div>
              <div className="text-2xl font-bold text-blue-800">{formatCurrency(capacity)}/mes</div>
              <p className="text-xs text-blue-600">
                Fórmula: ${formatCurrency(salary)} × 3% × 3 = {formatCurrency(capacity)}
              </p>
            </div>
          )}
        </div>
      )}

      {state.clientType === "monotributo" && (
        <div className="space-y-3">
          <p className="text-xs text-gray-500">Categoría AFIP del monotributista:</p>
          <div className="grid grid-cols-4 gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "py-3 rounded-xl border-2 font-bold text-lg transition-all",
                  selectedCategory === cat
                    ? "border-blue-500 bg-blue-500 text-white shadow-sm"
                    : "border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
          {selectedCategory && (
            <div className="flex items-center gap-2 text-blue-700 bg-blue-50 rounded-lg p-3 text-sm">
              <Info className="w-4 h-4 flex-shrink-0" />
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
            ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-200"
            : "bg-gray-100 text-gray-400 cursor-not-allowed"
        )}
      >
        Continuar <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
