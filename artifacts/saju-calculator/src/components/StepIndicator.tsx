import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: 1, label: "Tipo" },
  { id: 2, label: "Edad" },
  { id: 3, label: "Datos" },
  { id: 4, label: "Plan" },
  { id: 5, label: "Familia" },
  { id: 6, label: "Docs" },
  { id: 7, label: "Resumen" },
];

interface StepIndicatorProps {
  currentStep: number;
  onStepClick?: (step: number) => void;
  completedUpTo?: number;
}

export function StepIndicator({ currentStep, onStepClick, completedUpTo }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-between w-full px-1 py-2">
      {STEPS.map((step, index) => {
        const isCompleted = completedUpTo != null && step.id < completedUpTo;
        const isCurrent = step.id === currentStep;
        const isClickable = onStepClick && completedUpTo != null && step.id <= completedUpTo;

        return (
          <div key={step.id} className="flex items-center flex-1">
            <div
              className="flex flex-col items-center gap-1"
              onClick={() => isClickable && onStepClick(step.id)}
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200",
                  isCompleted && "bg-emerald-500 text-white cursor-pointer hover:bg-emerald-600 shadow-sm shadow-emerald-200",
                  isCurrent && "bg-sky-600 text-white shadow-md shadow-sky-200",
                  !isCompleted && !isCurrent && "bg-slate-100 text-slate-400"
                )}
              >
                {isCompleted ? <Check className="w-3.5 h-3.5" /> : step.id}
              </div>
              <span
                className={cn(
                  "text-xs font-medium hidden sm:block",
                  isCurrent && "text-sky-600",
                  isCompleted && "text-emerald-600",
                  !isCurrent && !isCompleted && "text-slate-400"
                )}
              >
                {step.label}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div
                className={cn(
                  "flex-1 mx-1 transition-all duration-300",
                  isCompleted ? "h-px bg-emerald-400" : "h-px bg-slate-200"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
