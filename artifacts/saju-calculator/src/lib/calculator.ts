import config from "@/data/saju-config.json";

export type ClientType = "dependency" | "monotributo" | "prepaid";
export type PlanId = "SAJU500" | "SAJU1100" | "SAJU2100" | "SAJU3100" | "SAJU4100";
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

/**
 * Maps an individual monotributo category letter to its group key used in
 * monotributo_adicionales (e.g. "A" → "A,B,C", "D" → "D").
 */
export function getCategoryGroup(category: string): string {
  if (["A", "B", "C"].includes(category.toUpperCase())) return "A,B,C";
  return category.toUpperCase();
}

/**
 * Get the final price for a given client type, age, and plan.
 *
 * - dependency  → pricing.relacion_dependencia[plan][ageRange]
 * - monotributo → pricing.monotributo[plan][ageRange]  (PRECIO FINAL)
 * - prepaid     → pricing.prepago[plan][ageRange]
 *
 * For monotributo the returned value is the PRECIO FINAL (total cuota).
 * To get the adicional use getMonotributoAdicional().
 */
export function getPrice(
  clientType: ClientType,
  age: number,
  planId: PlanId,
): number | null {
  const ageRange = getAgeRange(age);
  if (!ageRange) return null;

  const pricing = config.pricing as Record<string, Record<string, Record<string, number>>>;

  if (clientType === "dependency") {
    return pricing.relacion_dependencia?.[planId]?.[ageRange] ?? null;
  }

  if (clientType === "monotributo") {
    return pricing.monotributo?.[planId]?.[ageRange] ?? null;
  }

  if (clientType === "prepaid") {
    return pricing.prepago?.[planId]?.[ageRange] ?? null;
  }

  return null;
}

/**
 * Get the adicional a pagar for monotributo.
 * Source: monotributo_adicionales[plan][categoryGroup][ageRange]
 * Returns null if not applicable (e.g. plan has no additional for that category/age).
 */
export function getMonotributoAdicional(
  age: number,
  planId: PlanId,
  category: string,
): number | null {
  const ageRange = getAgeRange(age);
  if (!ageRange) return null;

  // SAJU500 has no adicionales table entry — return null
  if (planId === "SAJU500") return null;

  const adicionales = config.monotributo_adicionales as Record<string, Record<string, Record<string, number>>>;
  const group = getCategoryGroup(category);
  const val = adicionales?.[planId]?.[group]?.[ageRange];
  return val != null ? val : null;
}

export function suggestPlan(
  clientType: ClientType,
  holderAge: number,
  salary?: number | null,
): PlanId {
  const planIds: PlanId[] = ["SAJU500", "SAJU1100", "SAJU2100", "SAJU3100", "SAJU4100"];

  if (clientType === "dependency" && salary != null) {
    const capacity = calculateCapacity(salary);
    const ageRange = getAgeRange(holderAge);
    if (ageRange) {
      const pricing = config.pricing as Record<string, Record<string, Record<string, number>>>;
      // Suggest the best plan whose price fits within capacity
      for (const planId of planIds) {
        const price = pricing.relacion_dependencia?.[planId]?.[ageRange];
        if (price != null && capacity >= price) {
          return planId;
        }
      }
    }
    return "SAJU500";
  }

  if (holderAge <= 35) return "SAJU1100";
  if (holderAge <= 45) return "SAJU2100";
  if (holderAge <= 50) return "SAJU3100";
  return "SAJU3100";
}

export interface MemberPriceResult {
  member: FamilyMember;
  price: number | null;
  adicional: number | null;
}

export function calculateTotal(
  clientType: ClientType,
  holderAge: number,
  planId: PlanId,
  familyMembers: FamilyMember[],
  category?: string | null
): {
  holderPrice: number | null;
  holderAdicional: number | null;
  memberPrices: MemberPriceResult[];
  total: number | null;
} {
  const holderPrice = getPrice(clientType, holderAge, planId);
  const holderAdicional = clientType === "monotributo" && category
    ? getMonotributoAdicional(holderAge, planId, category)
    : null;

  const memberPrices: MemberPriceResult[] = familyMembers.map((member) => {
    const price = getPrice(clientType, member.age, planId);
    const adicional = clientType === "monotributo" && category
      ? getMonotributoAdicional(member.age, planId, category)
      : null;
    return { member, price, adicional };
  });

  const allPrices = [holderPrice, ...memberPrices.map((m) => m.price)];
  const hasNull = allPrices.some((p) => p === null);

  const total = hasNull
    ? null
    : allPrices.reduce<number>((sum, p) => sum + (p as number), 0);

  return { holderPrice, holderAdicional, memberPrices, total };
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
