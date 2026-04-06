import React, { createContext, useContext, useState, useCallback } from "react";
import type { ClientType, PlanId, FamilyMember, DocumentStatus, FamilyMemberType } from "@/lib/calculator";

export interface CalculatorState {
  step: number;
  clientType: ClientType | null;
  holderAge: number | null;
  salary: number | null;
  monotributoCategory: string | null;
  selectedPlan: PlanId | null;
  familyMembers: FamilyMember[];
  documentStatuses: DocumentStatus[];
}

interface CalculatorContextType {
  state: CalculatorState;
  setStep: (step: number) => void;
  setClientType: (type: ClientType) => void;
  setHolderAge: (age: number) => void;
  setSalary: (salary: number | null) => void;
  setMonotributoCategory: (cat: string | null) => void;
  setSelectedPlan: (plan: PlanId) => void;
  addFamilyMember: (type: FamilyMemberType, age: number, name: string, isStudent?: boolean) => void;
  removeFamilyMember: (id: string) => void;
  setDocumentStatus: (documentId: string, status: DocumentStatus["status"]) => void;
  resetAll: () => void;
}

const defaultState: CalculatorState = {
  step: 1,
  clientType: null,
  holderAge: null,
  salary: null,
  monotributoCategory: null,
  selectedPlan: null,
  familyMembers: [],
  documentStatuses: [],
};

const CalculatorContext = createContext<CalculatorContextType | null>(null);

export function CalculatorProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<CalculatorState>(defaultState);

  const setStep = useCallback((step: number) => {
    setState((s) => ({ ...s, step }));
  }, []);

  const setClientType = useCallback((type: ClientType) => {
    setState((s) => ({
      ...s,
      clientType: type,
      salary: null,
      monotributoCategory: null,
      selectedPlan: null,
      familyMembers: [],
      documentStatuses: [],
    }));
  }, []);

  const setHolderAge = useCallback((age: number) => {
    setState((s) => ({ ...s, holderAge: age }));
  }, []);

  const setSalary = useCallback((salary: number | null) => {
    setState((s) => ({ ...s, salary }));
  }, []);

  const setMonotributoCategory = useCallback((cat: string | null) => {
    setState((s) => ({ ...s, monotributoCategory: cat }));
  }, []);

  const setSelectedPlan = useCallback((plan: PlanId) => {
    setState((s) => ({ ...s, selectedPlan: plan }));
  }, []);

  const addFamilyMember = useCallback(
    (type: FamilyMemberType, age: number, name: string, isStudent?: boolean) => {
      const newMember: FamilyMember = {
        id: `member_${Date.now()}_${Math.random()}`,
        type,
        age,
        name,
        isStudent,
      };
      setState((s) => ({
        ...s,
        familyMembers: [...s.familyMembers, newMember],
      }));
    },
    []
  );

  const removeFamilyMember = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      familyMembers: s.familyMembers.filter((m) => m.id !== id),
    }));
  }, []);

  const setDocumentStatus = useCallback((documentId: string, status: DocumentStatus["status"]) => {
    setState((s) => {
      const existing = s.documentStatuses.find((d) => d.documentId === documentId);
      if (existing) {
        return {
          ...s,
          documentStatuses: s.documentStatuses.map((d) =>
            d.documentId === documentId ? { ...d, status } : d
          ),
        };
      }
      return {
        ...s,
        documentStatuses: [...s.documentStatuses, { documentId, status }],
      };
    });
  }, []);

  const resetAll = useCallback(() => {
    setState(defaultState);
  }, []);

  return (
    <CalculatorContext.Provider
      value={{
        state,
        setStep,
        setClientType,
        setHolderAge,
        setSalary,
        setMonotributoCategory,
        setSelectedPlan,
        addFamilyMember,
        removeFamilyMember,
        setDocumentStatus,
        resetAll,
      }}
    >
      {children}
    </CalculatorContext.Provider>
  );
}

export function useCalculator(): CalculatorContextType {
  const ctx = useContext(CalculatorContext);
  if (!ctx) throw new Error("useCalculator must be used inside CalculatorProvider");
  return ctx;
}
