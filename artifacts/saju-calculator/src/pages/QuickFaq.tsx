import { useState } from "react";
import { ChevronDown, ChevronUp, MessageCircle } from "lucide-react";
import config from "@/data/saju-config.json";

const faq = config.faq as Array<{ id: string; question: string; answer: string }>;

export function QuickFaq() {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2.5 mb-2">
        <div className="w-8 h-8 bg-sky-100 rounded-xl flex items-center justify-center">
          <MessageCircle className="w-4 h-4 text-sky-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Consulta rápida</h2>
          <p className="text-xs text-slate-500">Respuestas frecuentes del vendedor</p>
        </div>
      </div>

      <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-sm">
        {faq.map((item) => {
          const isOpen = openId === item.id;
          return (
            <div key={item.id} className="transition-all">
              <button
                onClick={() => setOpenId(isOpen ? null : item.id)}
                className="w-full flex items-start justify-between gap-3 px-5 py-4 text-left hover:bg-slate-50 transition-colors"
              >
                <span className="font-semibold text-sm text-slate-800 leading-relaxed">{item.question}</span>
                {isOpen ? (
                  <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                )}
              </button>
              {isOpen && (
                <div className="px-5 pb-4 pt-0">
                  <div className="bg-sky-50 border border-sky-100 rounded-xl p-4">
                    <p className="text-sm text-slate-700 leading-relaxed">{item.answer}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
