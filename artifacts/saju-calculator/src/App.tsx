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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 flex flex-col">
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-200/80 shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-black text-sm">S</span>
              </div>
              <div>
                <h1 className="text-sm font-black text-gray-900 leading-none">SAJU</h1>
                <p className="text-xs text-gray-400 leading-none">Calculadora de Ventas</p>
              </div>
            </div>
            <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-1">
              <button
                onClick={() => setActiveTab("calculator")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                  activeTab === "calculator"
                    ? "bg-white text-blue-700 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
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
                    ? "bg-white text-blue-700 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
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

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6">
        {activeTab === "faq" ? (
          <QuickFaq />
        ) : (
          <div className="space-y-4">
            {state.step > 1 && state.step < 7 && (
              <button
                onClick={handleBack}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors -ml-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Volver
              </button>
            )}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
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
    <div className="flex items-center justify-between bg-blue-600 text-white rounded-xl px-4 py-2.5 text-xs">
      <div className="flex items-center gap-3">
        <div>
          <div className="font-semibold opacity-75">Titular</div>
          <div className="font-bold">{state.holderAge} años · {state.clientType ? clientLabels[state.clientType] : ""}</div>
        </div>
        {state.familyMembers.length > 0 && (
          <div className="border-l border-white/20 pl-3">
            <div className="font-semibold opacity-75">Familiares</div>
            <div className="font-bold">{state.familyMembers.length} {state.familyMembers.length === 1 ? "miembro" : "miembros"}</div>
          </div>
        )}
      </div>
      <div className="text-right border-l border-white/20 pl-3">
        <div className="font-semibold opacity-75">Plan</div>
        <div className="font-bold">{state.selectedPlan} · {planNames[state.selectedPlan]}</div>
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
