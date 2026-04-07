import { useCalculator } from "@/context/CalculatorContext";
import type { ClientType } from "@/lib/calculator";
import { Briefcase, Store, User } from "lucide-react";
import { cn } from "@/lib/utils";

const clientOptions: { type: ClientType; icon: React.ElementType; title: string; description: string; tag?: string }[] = [
  {
    type: "dependency",
    icon: Briefcase,
    title: "Relación de Dependencia",
    description: "Trabajador formal con antigüedad 12+ meses. Precio base con subsidio.",
    tag: "Más común",
  },
  {
    type: "monotributo",
    icon: Store,
    title: "Monotributista",
    description: "Trabajador independiente registrado en AFIP. Precio base +30-40%.",
  },
  {
    type: "prepaid",
    icon: User,
    title: "Prepago Puro",
    description: "Sin relación laboral. Jubilado, estudiante, ama de casa.",
  },
];

export function Step1ClientType() {
  const { state, setClientType, setStep } = useCalculator();

  function handleSelect(type: ClientType) {
    setClientType(type);
    setTimeout(() => setStep(2), 150);
  }

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">¿Qué tipo de cliente?</h2>
        <p className="text-sm text-gray-500 mt-1">Seleccioná la categoría que corresponde al cliente</p>
      </div>

      <div className="space-y-3">
        {clientOptions.map(({ type, icon: Icon, title, description, tag }) => {
          const selected = state.clientType === type;
          return (
            <button
              key={type}
              onClick={() => handleSelect(type)}
              className={cn(
                "w-full flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all duration-200",
                selected
                  ? "border-blue-500 bg-blue-50 shadow-sm"
                  : "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/30"
              )}
            >
              <div
                className={cn(
                  "p-2.5 rounded-lg flex-shrink-0",
                  selected ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-500"
                )}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={cn("font-semibold text-sm", selected ? "text-blue-700" : "text-gray-800")}>
                    {title}
                  </span>
                  {tag && (
                    <span className="text-xs bg-emerald-100 text-emerald-700 font-medium px-2 py-0.5 rounded-full">
                      {tag}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{description}</p>
              </div>
              {selected && (
                <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
