import { useState } from "react";
import { useCalculator } from "@/context/CalculatorContext";
import {
  getFamilyMemberLabel,
  getMemberPrice,
  getHolderPrice,
  getAporteMT,
  getMonotributoAdicional,
  formatCurrency,
  isStudentEligible,
  calculateTotal,
} from "@/lib/calculator";
import type { FamilyMemberType, PlanId, MemberPriceResult } from "@/lib/calculator";
import { Plus, Trash2, Users, ChevronRight, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

const MEMBER_TYPES: { type: FamilyMemberType; label: string; color: string }[] = [
  { type: "spouse",    label: "Cónyuge",    color: "bg-rose-100 text-rose-700" },
  { type: "concubine", label: "Concubino/a", color: "bg-violet-100 text-violet-700" },
  { type: "child",     label: "Hijo/a",      color: "bg-amber-100 text-amber-700" },
];

export function Step5Family() {
  const { state, addFamilyMember, removeFamilyMember, setStep } = useCalculator();
  const [showForm, setShowForm] = useState(false);
  const [newType, setNewType] = useState<FamilyMemberType>("spouse");
  const [newAge, setNewAge] = useState("");
  const [newName, setNewName] = useState("");
  const [isStudent, setIsStudent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const parsedAge = parseInt(newAge, 10);
  const showStudentOption = !isNaN(parsedAge) && newType === "child" && parsedAge > 21 && parsedAge <= 25;

  function handleAdd() {
    const age = parseInt(newAge, 10);
    if (isNaN(age) || age < 0 || age > 120) {
      setFormError("Ingresá una edad válida.");
      return;
    }
    if (newType === "child" && !isStudentEligible(age, isStudent)) {
      setFormError("Los hijos mayores de 25 años no tienen cobertura. Menores de 21 sí, y entre 21-25 solo si son estudiantes.");
      return;
    }
    const name = newName.trim() || getFamilyMemberLabel(newType);
    addFamilyMember(newType, age, name, isStudent);
    setNewAge("");
    setNewName("");
    setIsStudent(false);
    setFormError(null);
    setShowForm(false);
  }

  const hasEnoughData = state.clientType && state.holderAge != null && state.selectedPlan;
  const totals = hasEnoughData
    ? calculateTotal(
        state.clientType!,
        state.holderAge!,
        state.selectedPlan as PlanId,
        state.familyMembers,
        state.monotributoCategory,
        state.salary
      )
    : null;

  const isDependency = state.clientType === "dependency";
  const isMonotributo = state.clientType === "monotributo";

  return (
    <div className="space-y-5">
      <div>
        <h2 className="step-heading">¿Agregamos familiares?</h2>
        <p className="step-subheading">Cónyuge, concubino/a, hijos hasta 21 años (estudiantes hasta 25)</p>
      </div>

      {state.familyMembers.length === 0 && !showForm && (
        <div className="flex flex-col items-center justify-center py-10 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
          <Users className="w-10 h-10 text-slate-300 mb-3" />
          <p className="text-sm text-slate-500 font-medium">Sin familiares por ahora</p>
          <p className="text-xs text-slate-400 mt-1">El titular puede agregar cobertura para su grupo familiar</p>
        </div>
      )}

      {state.familyMembers.map((member) => {
        const plan = state.selectedPlan as PlanId;

        const memberAporteMT = isMonotributo && state.monotributoCategory
          ? getAporteMT(state.monotributoCategory)
          : null;
        const memberAdicional = isMonotributo && plan && state.monotributoCategory
          ? getMonotributoAdicional(member.age, plan, state.monotributoCategory)
          : null;
        const memberTotal = isMonotributo && memberAporteMT != null && memberAdicional != null
          ? memberAporteMT + memberAdicional
          : null;

        const memberPrice = !isMonotributo && state.clientType && plan
          ? getMemberPrice(state.clientType, member.age, plan, state.monotributoCategory)
          : memberTotal;

        const dependencyResult = isDependency && totals
          ? totals.memberPrices.find((m) => m.member.id === member.id)
          : null;

        const typeInfo = MEMBER_TYPES.find((m) => m.type === member.type);
        return (
          <div key={member.id} className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm text-slate-800">{member.name}</span>
                  <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", typeInfo?.color)}>
                    {getFamilyMemberLabel(member.type)}
                  </span>
                  {member.isStudent && (
                    <span className="text-xs bg-sky-100 text-sky-700 font-semibold px-2 py-0.5 rounded-full">Estudiante</span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{member.age} años</p>
              </div>
              {!isDependency && memberPrice != null && (
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-bold text-slate-800">{formatCurrency(memberPrice)}</div>
                  <div className="text-xs text-slate-400">/mes</div>
                </div>
              )}
              {isDependency && (
                <div className="text-right flex-shrink-0">
                  {dependencyResult?.price != null ? (
                    <>
                      <div className="text-sm font-bold text-slate-800">{formatCurrency(dependencyResult.price)}</div>
                      <div className="text-xs text-slate-400">/mes</div>
                    </>
                  ) : (
                    <span className="text-xs text-slate-400 italic">Sin sueldo</span>
                  )}
                </div>
              )}
              <button
                onClick={() => removeFamilyMember(member.id)}
                className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {isMonotributo && memberAporteMT != null && memberAdicional != null && (
              <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                <span>Aporte AFIP: <strong className="text-slate-700">{formatCurrency(memberAporteMT)}</strong></span>
                <span>Adicional: <strong className="text-amber-700">{formatCurrency(memberAdicional)}</strong></span>
              </div>
            )}
          </div>
        );
      })}

      {/* Running total when family members are present */}
      {totals && state.familyMembers.length > 0 && (
        <div className="bg-sky-600 rounded-2xl p-5 text-white shadow-md shadow-sky-200/40">
          <p className="text-xs font-bold text-sky-200 uppercase tracking-widest mb-3">Costo estimado del grupo</p>
          <div className="space-y-2 mb-3">

            <div className="flex justify-between text-sm">
              <span className="text-sky-100">Titular ({state.holderAge} años)</span>
              <span className="font-semibold">
                {totals.holderPrice != null
                  ? (totals.holderPrice === 0 ? "Cubierto" : formatCurrency(totals.holderPrice))
                  : isDependency ? "Accede por aporte" : "—"}
              </span>
            </div>
            {isDependency && (
              <div className="text-right">
                <span className="text-xs text-sky-300">el titular no genera costo extra</span>
              </div>
            )}

            {totals.memberPrices.map(({ member, price, aporteMTPart, adicionalPart, fullMemberPrice, saldoAplicado }: MemberPriceResult) => (
              <div key={member.id}>
                <div className="flex justify-between text-sm">
                  <span className="text-sky-100">{member.name} ({member.age} años)</span>
                  <span className="font-semibold">
                    {price != null ? formatCurrency(price) : "—"}
                  </span>
                </div>
                {isMonotributo && aporteMTPart != null && adicionalPart != null && (
                  <div className="text-right">
                    <span className="text-xs text-sky-300">
                      aporte {formatCurrency(aporteMTPart)} + adicional {formatCurrency(adicionalPart)}
                    </span>
                  </div>
                )}
                {isDependency && fullMemberPrice != null && (
                  <div className="text-right">
                    {saldoAplicado != null && saldoAplicado > 0 ? (
                      <span className="text-xs text-sky-300">
                        plan {formatCurrency(fullMemberPrice)} − saldo {formatCurrency(saldoAplicado)}
                      </span>
                    ) : (
                      <span className="text-xs text-sky-300">precio según edad</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {totals.total != null && (
            <div className="border-t border-sky-500 pt-3 flex justify-between items-center">
              <span className="font-bold text-sm">TOTAL MENSUAL</span>
              <span className="text-2xl font-black">{formatCurrency(totals.total)}</span>
            </div>
          )}
          {isDependency && totals.total == null && (
            <p className="text-xs text-sky-300 mt-2 pt-2 border-t border-sky-500">
              Ingresá el sueldo bruto para calcular el costo del grupo familiar
            </p>
          )}
          {isMonotributo && (
            <p className="text-xs text-sky-200 mt-1 text-right">Titular paga adicional · Integrantes pagan aporte + adicional</p>
          )}
        </div>
      )}

      {/* Titular-only cost when no family members */}
      {totals && state.familyMembers.length === 0 && totals.holderPrice != null && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex justify-between items-center">
          <div>
            <p className="text-xs text-slate-500">
              {isMonotributo ? "Adicional a pagar (titular)" : "Costo titular"}
            </p>
            <p className="text-sm font-semibold text-slate-700">Plan {state.selectedPlan}</p>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-slate-800">{formatCurrency(totals.holderPrice)}</p>
            <p className="text-xs text-slate-400">/mes</p>
          </div>
        </div>
      )}

      {showForm && (
        <div className="border-2 border-sky-100 bg-sky-50/60 rounded-2xl p-5 space-y-4">
          <h3 className="font-bold text-sm text-slate-800">Nuevo familiar</h3>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Tipo de vínculo</label>
            <div className="grid grid-cols-3 gap-2">
              {MEMBER_TYPES.map(({ type, label }) => (
                <button
                  key={type}
                  onClick={() => { setNewType(type); setIsStudent(false); }}
                  className={cn(
                    "py-2.5 text-xs font-semibold rounded-xl border-2 transition-all",
                    newType === type
                      ? "border-sky-500 bg-sky-600 text-white shadow-sm shadow-sky-200"
                      : "border-slate-200 bg-white text-slate-700 hover:border-sky-300 hover:bg-sky-50"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Nombre (opcional)</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={getFamilyMemberLabel(newType)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white outline-none focus:border-sky-400 focus:shadow-sm focus:shadow-sky-100 transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Edad</label>
              <input
                type="number"
                value={newAge}
                onChange={(e) => { setNewAge(e.target.value); setFormError(null); }}
                placeholder="0"
                min={0}
                max={120}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white outline-none focus:border-sky-400 focus:shadow-sm focus:shadow-sky-100 transition-all"
              />
            </div>
          </div>

          {showStudentOption && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isStudent}
                onChange={(e) => setIsStudent(e.target.checked)}
                className="w-4 h-4 accent-sky-600"
              />
              <span className="text-xs text-slate-700">Es estudiante (entre 21 y 25 años)</span>
            </label>
          )}

          {formError && (
            <div className="flex items-center gap-2 text-amber-700 bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {formError}
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              className="flex-1 py-3 bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-sky-200"
            >
              Agregar
            </button>
            <button
              onClick={() => { setShowForm(false); setFormError(null); }}
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full py-3.5 border-2 border-dashed border-sky-200 rounded-xl text-sky-600 font-semibold text-sm hover:border-sky-400 hover:bg-sky-50 transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" /> Agregar familiar
        </button>
      )}

      <button
        onClick={() => setStep(6)}
        className="w-full py-4 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-sm shadow-sky-200/60"
      >
        Continuar a Documentación <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
