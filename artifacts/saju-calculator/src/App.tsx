import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CalculatorProvider, useCalculator } from "@/context/CalculatorContext";
import { StepIndicator } from "@/components/StepIndicator";
import { Step1ClientType } from "@/pages/Step1ClientType";
import { Step2Age } from "@/pages/Step2Age";
import { Step3EconomicData } from "@/pages/Step3EconomicData";
import { Step4Plan } from "@/pages/Step4Plan";
import { Step5Family } from "@/pages/Step5Family";
import { Step6Documentation } from "@/pages/Step6Documentation";
import { Step7Summary } from "@/pages/Step7Summary";
import { QuickFaq } from "@/pages/QuickFaq";
import { ChevronLeft, CalculatorIcon, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const queryClient = new QueryClient();

type ActiveTab = "calculator" | "faq";

function AppContent() {
  const { state, setStep } = useCalculator();
  const [activeTab, setActiveTab] = useState<ActiveTab>("calculator");

  const maxCompletedStep = (() => {
    if (!state.clientType) return 1;
    if (state.holderAge == null) return 2;
    if (state.clientType === "dependency" && state.salary == null) return 3;
    if (state.clientType === "monotributo" && !state.monotributoCategory) return 3;
    if (!state.selectedPlan) return 4;
    return state.step;
  })();

  function handleBack() {
    if (state.step > 1) {
      let target = state.step - 1;
      if (target === 3 && state.clientType === "prepaid") {
        target = 2;
      }
      setStep(target);
    }
  }

  const stepComponents: Record<number, React.ReactElement> = {
    1: <Step1ClientType />,
    2: <Step2Age />,
    3: <Step3EconomicData />,
    4: <Step4Plan />,
    5: <Step5Family />,
    6: <Step6Documentation />,
    7: <Step7Summary />,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50/60 via-white to-slate-50/80 flex flex-col">
      {/* Top accent line */}
      <div className="h-1 bg-gradient-to-r from-sky-500 via-sky-600 to-sky-500" />

      <header className="sticky top-0 z-50 bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-3.5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-sky-600 rounded-xl flex items-center justify-center shadow-sm shadow-sky-200">
                <span className="text-white font-black text-base leading-none">S</span>
              </div>
              <div>
                <h1 className="text-sm font-black text-slate-800 leading-none tracking-tight">SAJU</h1>
                <p className="text-xs text-slate-400 leading-none mt-0.5">Calculadora de Ventas</p>
              </div>
            </div>
            <div className="flex items-center bg-slate-100 rounded-xl p-1 gap-0.5">
              <button
                onClick={() => setActiveTab("calculator")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                  activeTab === "calculator"
                    ? "bg-white text-sky-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                <CalculatorIcon className="w-3.5 h-3.5" />
                Calculadora
              </button>
              <button
                onClick={() => setActiveTab("faq")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                  activeTab === "faq"
                    ? "bg-white text-sky-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                FAQ
              </button>
            </div>
          </div>

          {activeTab === "calculator" && (
            <StepIndicator
              currentStep={state.step}
              completedUpTo={maxCompletedStep}
              onStepClick={(s) => s <= maxCompletedStep && setStep(s)}
            />
          )}
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-7">
        {activeTab === "faq" ? (
          <QuickFaq />
        ) : (
          <div className="space-y-4">
            {state.step > 1 && state.step < 7 && (
              <button
                onClick={handleBack}
                className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-sky-600 transition-colors -ml-1 font-medium"
              >
                <ChevronLeft className="w-4 h-4" />
                Volver
              </button>
            )}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-md shadow-slate-200/40 p-6">
              {stepComponents[state.step] ?? <Step1ClientType />}
            </div>

            {state.step > 1 && state.selectedPlan && (
              <QuickSummaryBanner />
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function QuickSummaryBanner() {
  const { state } = useCalculator();
  if (!state.selectedPlan || !state.holderAge) return null;

  const planNames: Record<string, string> = {
    SAJU500: "El Inicial",
    SAJU1100: "El Básico",
    SAJU2100: "El Popular",
    SAJU3100: "El Premium",
    SAJU4100: "El Total",
  };

  const clientLabels: Record<string, string> = {
    dependency: "Dependencia",
    monotributo: `Monotributo ${state.monotributoCategory ?? ""}`.trim(),
    prepaid: "Prepago",
  };

  return (
    <div className="flex items-center justify-between bg-sky-600 text-white rounded-xl px-4 py-3 text-xs shadow-sm shadow-sky-200">
      <div className="flex items-center gap-4">
        <div>
          <div className="font-medium text-sky-200">Titular</div>
          <div className="font-bold mt-0.5">{state.holderAge} años · {state.clientType ? clientLabels[state.clientType] : ""}</div>
        </div>
        {state.familyMembers.length > 0 && (
          <div className="border-l border-sky-500 pl-4">
            <div className="font-medium text-sky-200">Familiares</div>
            <div className="font-bold mt-0.5">{state.familyMembers.length} {state.familyMembers.length === 1 ? "miembro" : "miembros"}</div>
          </div>
        )}
      </div>
      <div className="text-right border-l border-sky-500 pl-4">
        <div className="font-medium text-sky-200">Plan</div>
        <div className="font-bold mt-0.5">{state.selectedPlan} · {planNames[state.selectedPlan]}</div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <CalculatorProvider>
        <AppContent />
      </CalculatorProvider>
    </QueryClientProvider>
  );
}
