import { useState } from "react";
import { useCalculator } from "@/context/CalculatorContext";
import { getAgeRange } from "@/lib/calculator";
import { AlertCircle, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Step2Age() {
  const { state, setHolderAge, setStep } = useCalculator();
  const [inputValue, setInputValue] = useState(state.holderAge?.toString() ?? "");
  const [error, setError] = useState<string | null>(null);

  const parsedAge = parseInt(inputValue, 10);
  const ageRange = !isNaN(parsedAge) && parsedAge >= 0 ? getAgeRange(parsedAge) : null;

  const isOutOfRange = !isNaN(parsedAge) && parsedAge >= 0 && parsedAge <= 120 && !ageRange;

  function handleContinue() {
    if (isNaN(parsedAge) || parsedAge < 0 || parsedAge > 120) {
      setError("Por favor ingresá una edad válida entre 0 y 120 años.");
      return;
    }
    if (!ageRange) {
      setError("Esta edad está fuera del rango de cobertura SAJU (0-55 años).");
      return;
    }
    setError(null);
    setHolderAge(parsedAge);
    setTimeout(() => setStep(3), 150);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">¿Cuántos años tiene el titular?</h2>
        <p className="text-sm text-gray-500 mt-1">Cobertura disponible hasta 55 años</p>
      </div>

      <div className="space-y-3">
        <div className="relative">
          <input
            type="number"
            min={0}
            max={120}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setError(null);
            }}
            onKeyDown={(e) => e.key === "Enter" && handleContinue()}
            placeholder="Ej: 38"
            className={cn(
              "w-full text-4xl font-bold text-center py-5 rounded-xl border-2 outline-none transition-all",
              "placeholder:text-gray-300 text-gray-900",
              error ? "border-red-400 bg-red-50" : "border-gray-200 bg-gray-50 focus:border-blue-400 focus:bg-white"
            )}
            autoFocus
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-600 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {ageRange && !error && (
          <div className="flex items-center justify-center">
            <span className="text-xs bg-blue-100 text-blue-700 font-medium px-3 py-1.5 rounded-full">
              Rango de edad: {ageRange}
            </span>
          </div>
        )}

        {isOutOfRange && (
          <div className="flex items-center gap-2 text-amber-600 text-sm bg-amber-50 p-3 rounded-lg">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>Esta edad supera el rango de cobertura SAJU (máximo 55 años).</span>
          </div>
        )}
      </div>

      <button
        onClick={handleContinue}
        disabled={!inputValue || isNaN(parsedAge)}
        className={cn(
          "w-full py-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all",
          inputValue && !isNaN(parsedAge) && ageRange
            ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-200"
            : "bg-gray-100 text-gray-400 cursor-not-allowed"
        )}
      >
        Continuar <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
