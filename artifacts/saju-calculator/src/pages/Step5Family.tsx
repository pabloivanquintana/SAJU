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
import type { FamilyMemberType, PlanId } from "@/lib/calculator";
import { Plus, Trash2, Users, ChevronRight, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

const MEMBER_TYPES: { type: FamilyMemberType; label: string; color: string }[] = [
  { type: "spouse", label: "Cónyuge", color: "bg-pink-100 text-pink-700" },
  { type: "concubine", label: "Concubino/a", color: "bg-purple-100 text-purple-700" },
  { type: "child", label: "Hijo/a", color: "bg-amber-100 text-amber-700" },
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
        state.monotributoCategory
      )
    : null;

  const isDependency = state.clientType === "dependency";
  const isMonotributo = state.clientType === "monotributo";

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">¿Agregamos familiares?</h2>
        <p className="text-sm text-gray-500 mt-1">Cónyuge, concubino/a, hijos hasta 21 años (estudiantes hasta 25)</p>
      </div>

      {state.familyMembers.length === 0 && !showForm && (
        <div className="flex flex-col items-center justify-center py-8 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
          <Users className="w-10 h-10 text-gray-300 mb-3" />
          <p className="text-sm text-gray-500 font-medium">Sin familiares por ahora</p>
          <p className="text-xs text-gray-400 mt-1">El titular puede agregar cobertura para su grupo familiar</p>
        </div>
      )}

      {state.familyMembers.map((member) => {
        const plan = state.selectedPlan as PlanId;

        // For monotributo: show aporte_mt + adicional breakdown
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

        const typeInfo = MEMBER_TYPES.find((m) => m.type === member.type);
        return (
          <div key={member.id} className="p-3 bg-white border border-gray-200 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm text-gray-800">{member.name}</span>
                  <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", typeInfo?.color)}>
                    {getFamilyMemberLabel(member.type)}
                  </span>
                  {member.isStudent && (
                    <span className="text-xs bg-blue-100 text-blue-700 font-medium px-2 py-0.5 rounded-full">Estudiante</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{member.age} años</p>
              </div>
              {!isDependency && memberPrice != null && (
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-bold text-gray-800">{formatCurrency(memberPrice)}</div>
                  <div className="text-xs text-gray-400">/mes</div>
                </div>
              )}
              {isDependency && (
                <div className="text-right flex-shrink-0">
                  <span className="text-xs text-amber-600 font-medium">Costo adicional</span>
                  <div className="text-xs text-gray-400">a definir</div>
                </div>
              )}
              <button
                onClick={() => removeFamilyMember(member.id)}
                className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Monotributo member: show aporte_mt + adicional breakdown */}
            {isMonotributo && memberAporteMT != null && memberAdicional != null && (
              <div className="mt-2 pt-2 border-t border-gray-100 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                <span>Aporte AFIP: <strong className="text-gray-700">{formatCurrency(memberAporteMT)}</strong></span>
                <span>Adicional: <strong className="text-amber-700">{formatCurrency(memberAdicional)}</strong></span>
              </div>
            )}
          </div>
        );
      })}

      {/* Running total when family members are present */}
      {totals && state.familyMembers.length > 0 && (
        <div className="bg-blue-600 rounded-xl p-4 text-white">
          <p className="text-xs font-semibold text-blue-200 uppercase tracking-wider mb-3">Costo estimado del grupo</p>
          <div className="space-y-1.5 mb-3">

            {/* Holder row */}
            <div className="flex justify-between text-sm">
              <span className="text-blue-100">Titular ({state.holderAge} años)</span>
              <span className="font-semibold">
                {totals.holderPrice != null
                  ? formatCurrency(totals.holderPrice)
                  : isDependency ? "Accede por aporte" : "—"}
              </span>
            </div>
            {isMonotributo && totals.holderPrice != null && (
              <div className="text-right">
                <span className="text-xs text-blue-300">solo adicional</span>
              </div>
            )}
            {isDependency && (
              <div className="text-right">
                <span className="text-xs text-blue-300">el titular no genera costo extra</span>
              </div>
            )}

            {/* Family member rows */}
            {totals.memberPrices.map(({ member, price, aporteMTPart, adicionalPart }) => (
              <div key={member.id}>
                <div className="flex justify-between text-sm">
                  <span className="text-blue-100">{member.name} ({member.age} años)</span>
                  <span className="font-semibold">
                    {price != null
                      ? formatCurrency(price)
                      : isDependency ? "Costo a definir" : "—"}
                  </span>
                </div>
                {isMonotributo && aporteMTPart != null && adicionalPart != null && (
                  <div className="text-right">
                    <span className="text-xs text-blue-300">
                      aporte {formatCurrency(aporteMTPart)} + adicional {formatCurrency(adicionalPart)}
                    </span>
                  </div>
                )}
                {isDependency && (
                  <div className="text-right">
                    <span className="text-xs text-amber-300">genera costo adicional</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {totals.total != null && (
            <div className="border-t border-blue-500 pt-3 flex justify-between items-center">
              <span className="font-bold">TOTAL MENSUAL</span>
              <span className="text-2xl font-bold">{formatCurrency(totals.total)}</span>
            </div>
          )}
          {isDependency && (
            <p className="text-xs text-amber-300 mt-2 pt-2 border-t border-blue-500">
              Titular accede por capacidad de aporte · Los familiares generan costo adicional (tabla pendiente de configuración)
            </p>
          )}
          {isMonotributo && (
            <p className="text-xs text-blue-300 mt-1 text-right">Titular paga adicional · Integrantes pagan aporte + adicional</p>
          )}
        </div>
      )}

      {/* Titular-only cost when no family members (non-dependency) */}
      {totals && state.familyMembers.length === 0 && totals.holderPrice != null && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex justify-between items-center">
          <div>
            <p className="text-xs text-gray-500">
              {isMonotributo ? "Adicional a pagar (titular)" : "Costo titular"}
            </p>
            <p className="text-sm font-semibold text-gray-700">Plan {state.selectedPlan}</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-gray-900">{formatCurrency(totals.holderPrice)}</p>
            <p className="text-xs text-gray-400">/mes</p>
          </div>
        </div>
      )}

      {showForm && (
        <div className="border-2 border-blue-200 bg-blue-50/50 rounded-xl p-4 space-y-4">
          <h3 className="font-semibold text-sm text-gray-800">Nuevo familiar</h3>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1.5 block">Tipo de vínculo</label>
            <div className="grid grid-cols-3 gap-2">
              {MEMBER_TYPES.map(({ type, label }) => (
                <button
                  key={type}
                  onClick={() => { setNewType(type); setIsStudent(false); }}
                  className={cn(
                    "py-2 text-xs font-semibold rounded-lg border-2 transition-all",
                    newType === type
                      ? "border-blue-500 bg-blue-500 text-white"
                      : "border-gray-200 bg-white text-gray-700 hover:border-blue-300"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1.5 block">Nombre (opcional)</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={getFamilyMemberLabel(newType)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white outline-none focus:border-blue-400 transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1.5 block">Edad</label>
              <input
                type="number"
                value={newAge}
                onChange={(e) => { setNewAge(e.target.value); setFormError(null); }}
                placeholder="0"
                min={0}
                max={120}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white outline-none focus:border-blue-400 transition-all"
              />
            </div>
          </div>

          {showStudentOption && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isStudent}
                onChange={(e) => setIsStudent(e.target.checked)}
                className="w-4 h-4 accent-blue-600"
              />
              <span className="text-xs text-gray-700">Es estudiante (entre 21 y 25 años)</span>
            </label>
          )}

          {formError && (
            <div className="flex items-center gap-2 text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-xs">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {formError}
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Agregar
            </button>
            <button
              onClick={() => { setShowForm(false); setFormError(null); }}
              className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full py-3 border-2 border-dashed border-blue-200 rounded-xl text-blue-600 font-semibold text-sm hover:border-blue-400 hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" /> Agregar familiar
        </button>
      )}

      <button
        onClick={() => setStep(6)}
        className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-sm shadow-blue-200"
      >
        Continuar a Documentación <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
