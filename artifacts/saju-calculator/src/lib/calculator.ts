import config from "@/data/saju-config.json";

export type ClientType = "dependency" | "monotributo" | "prepaid";
export type PlanId = "SAJU1100" | "SAJU2100" | "SAJU3100" | "SAJU4100";
export type AgeRange = "0-17" | "18-35" | "36-45" | "46-50" | "51-55";
export type FamilyMemberType = "spouse" | "concubine" | "child";

export interface FamilyMember {
  id: string;
  type: FamilyMemberType;
  age: number;
  name: string;
  isStudent?: boolean;
}

export interface DocumentStatus {
  documentId: string;
  status: "pending" | "available" | "missing";
}

export interface CalculatorState {
  clientType: ClientType | null;
  holderAge: number | null;
  salary: number | null;
  monotributoCategory: string | null;
  selectedPlan: PlanId | null;
  familyMembers: FamilyMember[];
  documentStatuses: DocumentStatus[];
}

export function getAgeRange(age: number): AgeRange | null {
  if (age < 0 || age > 120) return null;
  if (age <= 17) return "0-17";
  if (age <= 35) return "18-35";
  if (age <= 45) return "36-45";
  if (age <= 50) return "46-50";
  if (age <= 55) return "51-55";
  return null;
}

export function calculateCapacity(salary: number): number {
  return salary * 0.03 * 3;
}

export function getPrice(
  clientType: ClientType,
  age: number,
  planId: PlanId,
  category?: string
): number | null {
  const ageRange = getAgeRange(age);
  if (!ageRange) return null;

  const tables = config.pricingTables as Record<string, unknown>;

  if (clientType === "dependency") {
    const table = tables.dependency as Record<string, Record<string, number>>;
    return table[ageRange]?.[planId] ?? null;
  }

  if (clientType === "monotributo") {
    if (!category) return null;
    const table = tables.monotributo as Record<string, Record<string, Record<string, number>>>;
    return table[category]?.[ageRange]?.[planId] ?? null;
  }

  if (clientType === "prepaid") {
    const table = tables.prepaid as Record<string, Record<string, number>>;
    return table[ageRange]?.[planId] ?? null;
  }

  return null;
}

export function suggestPlan(
  clientType: ClientType,
  holderAge: number,
  salary?: number | null,
  category?: string | null
): PlanId {
  const planIds: PlanId[] = ["SAJU1100", "SAJU2100", "SAJU3100", "SAJU4100"];

  if (clientType === "dependency" && salary != null) {
    const capacity = calculateCapacity(salary);
    const ageRange = getAgeRange(holderAge);
    if (ageRange) {
      const table = (config.pricingTables as Record<string, unknown>).dependency as Record<string, Record<string, number>>;
      for (const planId of planIds) {
        const price = table[ageRange]?.[planId];
        if (price != null && capacity >= price) {
          return planId;
        }
      }
    }
    return "SAJU1100";
  }

  if (holderAge <= 35) return "SAJU1100";
  if (holderAge <= 45) return "SAJU2100";
  if (holderAge <= 50) return "SAJU3100";
  return "SAJU3100";
}

export function calculateTotal(
  clientType: ClientType,
  holderAge: number,
  planId: PlanId,
  familyMembers: FamilyMember[],
  category?: string | null
): {
  holderPrice: number | null;
  memberPrices: Array<{ member: FamilyMember; price: number | null }>;
  total: number | null;
} {
  const holderPrice = getPrice(clientType, holderAge, planId, category ?? undefined);

  const memberPrices = familyMembers.map((member) => {
    const price = getPrice(clientType, member.age, planId, category ?? undefined);
    return { member, price };
  });

  const allPrices = [holderPrice, ...memberPrices.map((m) => m.price)];
  const hasNull = allPrices.some((p) => p === null);

  const total = hasNull
    ? null
    : allPrices.reduce<number>((sum, p) => sum + (p as number), 0);

  return { holderPrice, memberPrices, total };
}

export function isStudentEligible(age: number, isStudent: boolean): boolean {
  if (age <= 21) return true;
  if (age <= 25 && isStudent) return true;
  return false;
}

export function getRequiredDocuments(
  clientType: ClientType,
  familyMembers: FamilyMember[]
): Array<{
  id: string;
  name: string;
  purpose: string;
  howToObtain: string;
  required: boolean;
  critical?: boolean;
  group: string;
}> {
  const docs = config.requiredDocuments as Record<string, unknown>;
  const holderDocs = (docs[clientType] as Array<{ id: string; name: string; purpose: string; howToObtain: string; required: boolean; critical?: boolean }>).map((d) => ({
    ...d,
    group: "Titular",
  }));

  const familyDocs: typeof holderDocs = [];

  familyMembers.forEach((member) => {
    const familyDocsSource = docs.family_members as Record<string, Array<{ id: string; name: string; purpose: string; howToObtain: string; required: boolean; critical?: boolean }>>;
    
    let memberDocKey: string = member.type;
    if (member.type === "child" && member.age > 21 && member.isStudent) {
      memberDocKey = "student_child";
    }

    const memberDocs = familyDocsSource[memberDocKey] ?? familyDocsSource[member.type] ?? [];
    memberDocs.forEach((d) => {
      familyDocs.push({
        ...d,
        id: `${d.id}_${member.id}`,
        name: `${d.name} (${member.name || memberLabel(member.type)})`,
        group: member.name || memberLabel(member.type),
      });
    });
  });

  return [...holderDocs, ...familyDocs];
}

function memberLabel(type: FamilyMemberType): string {
  const labels: Record<FamilyMemberType, string> = {
    spouse: "Cónyuge",
    concubine: "Concubino/a",
    child: "Hijo/a",
  };
  return labels[type] || type;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getFamilyMemberLabel(type: FamilyMemberType): string {
  return {
    spouse: "Cónyuge",
    concubine: "Concubino/a",
    child: "Hijo/a",
  }[type];
}
