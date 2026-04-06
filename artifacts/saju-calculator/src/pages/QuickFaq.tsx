import { useState } from "react";
import { ChevronDown, ChevronUp, MessageCircle } from "lucide-react";
import config from "@/data/saju-config.json";

const faq = config.faq as Array<{ id: string; question: string; answer: string }>;

export function QuickFaq() {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-6">
        <MessageCircle className="w-5 h-5 text-blue-500" />
        <h2 className="text-xl font-bold text-gray-900">Consulta rápida</h2>
      </div>
      <p className="text-sm text-gray-500 -mt-2">Respuestas a las preguntas más frecuentes del vendedor</p>

      <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden bg-white">
        {faq.map((item) => {
          const isOpen = openId === item.id;
          return (
            <div key={item.id} className="transition-all">
              <button
                onClick={() => setOpenId(isOpen ? null : item.id)}
                className="w-full flex items-start justify-between gap-3 px-4 py-4 text-left hover:bg-gray-50 transition-colors"
              >
                <span className="font-semibold text-sm text-gray-800 leading-relaxed">{item.question}</span>
                {isOpen ? (
                  <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                )}
              </button>
              {isOpen && (
                <div className="px-4 pb-4 pt-0">
                  <div className="bg-blue-50 rounded-xl p-4">
                    <p className="text-sm text-gray-700 leading-relaxed">{item.answer}</p>
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
