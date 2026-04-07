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
 * Maps an individual category letter to its group key in monotributo_adicionales.
 * A/B/C → "A,B,C"  |  D → "D"  |  etc.
 */
export function getCategoryGroup(category: string): string {
  if (["A", "B", "C"].includes(category.toUpperCase())) return "A,B,C";
  return category.toUpperCase();
}

// ─── DEPENDENCY ────────────────────────────────────────────────────────────────

/**
 * Returns the price of a plan under relación de dependencia.
 * The employer/AFIP contributes capacity = salary × 3% × 3.
 * If capacity >= planPrice → employee pays $0 (fully covered).
 * If capacity < planPrice  → employee pays the difference.
 */
export function getDependencyPlanPrice(planId: PlanId, age: number): number | null {
  const ageRange = getAgeRange(age);
  if (!ageRange) return null;
  const pricing = config.pricing as Record<string, Record<string, Record<string, number>>>;
  return pricing.relacion_dependencia?.[planId]?.[ageRange] ?? null;
}

/**
 * Returns how much the employee pays out of pocket for this plan.
 * diferencia = max(0, planPrice - capacity)
 * Returns 0 if the employer contribution covers the full plan price.
 */
export function getDependencyDifference(salary: number, planId: PlanId, age: number): number {
  const planPrice = getDependencyPlanPrice(planId, age);
  if (planPrice == null) return 0;
  const cap = calculateCapacity(salary);
  return Math.max(0, planPrice - cap);
}

// ─── MONOTRIBUTO ───────────────────────────────────────────────────────────────

/**
 * Returns the APORTE_MT for a given category group.
 * This is what the titular already pays to AFIP — it is NOT an extra charge for the titular.
 * It IS charged for each additional family member.
 */
export function getAporteMT(category: string): number | null {
  const adicionales = config.monotributo_adicionales as Record<string, Record<string, number>>;
  const group = getCategoryGroup(category);
  const val = adicionales?.aporte_mt?.[group];
  return val != null ? val : null;
}

/**
 * Returns the ADICIONAL a pagar for a given plan / category / age.
 * Source: monotributo_adicionales[plan][categoryGroup][ageRange]
 *
 * - Titular pays: ONLY this adicional
 * - Family member pays: aporte_mt + this adicional
 */
export function getMonotributoAdicional(
  age: number,
  planId: PlanId,
  category: string
): number | null {
  const ageRange = getAgeRange(age);
  if (!ageRange) return null;
  if (planId === "SAJU500") return null; // SAJU500 is prepaid-only

  const adicionales = config.monotributo_adicionales as Record<string, Record<string, Record<string, number>>>;
  const group = getCategoryGroup(category);
  const val = adicionales?.[planId]?.[group]?.[ageRange];
  return val != null ? val : null;
}

// ─── DEPENDENCY FAMILY MEMBER ─────────────────────────────────────────────────

/**
 * Returns the additional cost a FAMILY MEMBER pays under relación de dependencia.
 *
 * The holder accesses the plan via capacity threshold (no monetary charge for them),
 * but each additional dependent DOES generate a cost.
 *
 * TODO: Populate "dependency_family_pricing" in saju-config.json with the actual
 * per-member cost table (same shape as pricing.relacion_dependencia but representing
 * a real cost, not a threshold). Then uncomment the lookup below.
 *
 * Format expected in JSON:
 *   "dependency_family_pricing": {
 *     "SAJU1100": { "0-17": XXXX, "18-35": XXXX, ... },
 *     ...
 *   }
 */
export function getDependencyMemberPrice(planId: PlanId, age: number): number | null {
  const ageRange = getAgeRange(age);
  if (!ageRange) return null;
  // TODO: uncomment once dependency_family_pricing is defined in saju-config.json
  // const pricing = (config as Record<string, unknown>).dependency_family_pricing as
  //   Record<string, Record<string, number>> | undefined;
  // return pricing?.[planId]?.[ageRange] ?? null;
  return null; // pending data definition
}

// ─── PREPAID ──────────────────────────────────────────────────────────────────

export function getPrepaidPrice(planId: PlanId, age: number): number | null {
  const ageRange = getAgeRange(age);
  if (!ageRange) return null;
  const pricing = config.pricing as Record<string, Record<string, Record<string, number>>>;
  return pricing.prepago?.[planId]?.[ageRange] ?? null;
}

// ─── UNIFIED PRICE HELPERS ────────────────────────────────────────────────────

/**
 * Price the TITULAR pays for this plan.
 *
 * - dependency  → diferencia = max(0, planPrice - capacity). 0 means fully covered.
 * - monotributo → adicional only  (NOT pricing.monotributo — that value is not the charge)
 * - prepaid     → pricing.prepago[plan][ageRange]
 */
export function getHolderPrice(
  clientType: ClientType,
  age: number,
  planId: PlanId,
  category?: string | null,
  salary?: number | null
): number | null {
  if (clientType === "dependency") {
    if (salary == null) return null;
    return getDependencyDifference(salary, planId, age);
  }
  if (clientType === "prepaid") return getPrepaidPrice(planId, age);
  if (clientType === "monotributo") {
    if (!category) return null;
    return getMonotributoAdicional(age, planId, category);
  }
  return null;
}

/**
 * Price a FAMILY MEMBER pays for this plan.
 *
 * - dependency  → getDependencyMemberPrice (TODO: table pending)
 * - monotributo → aporte_mt + adicional  (member pays both)
 * - prepaid     → pricing.prepago[plan][ageRange]
 */
export function getMemberPrice(
  clientType: ClientType,
  age: number,
  planId: PlanId,
  category?: string | null
): number | null {
  if (clientType === "dependency") return getDependencyMemberPrice(planId, age);
  if (clientType === "prepaid") return getPrepaidPrice(planId, age);
  if (clientType === "monotributo") {
    if (!category) return null;
    const aporteMT = getAporteMT(category);
    const adicional = getMonotributoAdicional(age, planId, category);
    if (aporteMT == null || adicional == null) return null;
    return aporteMT + adicional;
  }
  return null;
}

// ─── SUGGEST PLAN ─────────────────────────────────────────────────────────────

export function suggestPlan(
  clientType: ClientType,
  holderAge: number,
  salary?: number | null
): PlanId {
  const nonPrepaidPlans: PlanId[] = ["SAJU1100", "SAJU2100", "SAJU3100", "SAJU4100"];
  const prepaidPlans: PlanId[] = ["SAJU500", "SAJU1100", "SAJU2100", "SAJU3100", "SAJU4100"];

  if (clientType === "prepaid") {
    // Suggest by age for prepaid
    if (holderAge <= 35) return "SAJU1100";
    if (holderAge <= 45) return "SAJU2100";
    if (holderAge <= 50) return "SAJU3100";
    return "SAJU3100";
  }

  if (clientType === "dependency" && salary != null) {
    const capacity = calculateCapacity(salary);
    const ageRange = getAgeRange(holderAge);
    if (ageRange) {
      const pricing = config.pricing as Record<string, Record<string, Record<string, number>>>;
      // Find the best plan whose THRESHOLD the client's capacity can meet
      for (const planId of [...nonPrepaidPlans].reverse()) {
        const threshold = pricing.relacion_dependencia?.[planId]?.[ageRange];
        if (threshold != null && capacity >= threshold) {
          return planId;
        }
      }
    }
    return "SAJU1100";
  }

  // Monotributo / dependency without salary: suggest by age
  if (holderAge <= 35) return "SAJU1100";
  if (holderAge <= 45) return "SAJU2100";
  if (holderAge <= 50) return "SAJU3100";
  return "SAJU3100";
}

// ─── TOTAL CALCULATION ────────────────────────────────────────────────────────

export interface MemberPriceResult {
  member: FamilyMember;
  price: number | null;       // total the member pays
  aporteMTPart: number | null; // for monotributo: the aporte_mt component
  adicionalPart: number | null; // for monotributo: the adicional component
}

export interface TotalResult {
  holderPrice: number | null;     // diferencia que paga el titular (0 = cubierto por empleador)
  memberPrices: MemberPriceResult[];
  total: number | null;
}

/**
 * Calculates the full cost breakdown for a case.
 *
 * dependency:
 *   - holderPrice = max(0, planPrice - capacity)  → diferencia que paga el empleado
 *   - memberPrices = getDependencyMemberPrice per member (null until table is populated)
 *   - total = holderPrice + sum of non-null member prices
 *
 * monotributo:
 *   - holderPrice = adicional_titular
 *   - each memberPrice = aporte_mt + adicional_member
 *   - total = holderPrice + SUM(memberPrices)
 *
 * prepaid:
 *   - all prices from pricing.prepago[plan][ageRange]
 *   - total = sum of all
 */
export function calculateTotal(
  clientType: ClientType,
  holderAge: number,
  planId: PlanId,
  familyMembers: FamilyMember[],
  category?: string | null,
  salary?: number | null
): TotalResult {
  const holderPrice = getHolderPrice(clientType, holderAge, planId, category, salary);

  const memberPrices: MemberPriceResult[] = familyMembers.map((member) => {
    if (clientType === "monotributo" && category) {
      const aporteMTPart = getAporteMT(category);
      const adicionalPart = getMonotributoAdicional(member.age, planId, category);
      const price = aporteMTPart != null && adicionalPart != null
        ? aporteMTPart + adicionalPart
        : null;
      return { member, price, aporteMTPart, adicionalPart };
    }
    const price = getMemberPrice(clientType, member.age, planId, category);
    return { member, price, aporteMTPart: null, adicionalPart: null };
  });

  let total: number | null;

  if (clientType === "dependency") {
    // holderPrice is the diferencia (can be 0 if fully covered, null if no salary)
    const nonNullMemberPrices = memberPrices
      .map((m) => m.price)
      .filter((p): p is number => p !== null);
    if (holderPrice != null) {
      total = holderPrice + nonNullMemberPrices.reduce((sum, p) => sum + p, 0);
    } else if (nonNullMemberPrices.length > 0) {
      total = nonNullMemberPrices.reduce((sum, p) => sum + p, 0);
    } else {
      total = null;
    }
  } else {
    // monotributo / prepaid: total requires ALL prices to be non-null
    const allPrices = [holderPrice, ...memberPrices.map((m) => m.price)];
    const hasNull = allPrices.some((p) => p === null);
    total = hasNull
      ? null
      : allPrices.reduce<number>((sum, p) => sum + (p as number), 0);
  }

  return { holderPrice, memberPrices, total };
}

export function isStudentEligible(age: number, isStudent: boolean): boolean {
  if (age <= 21) return true;
  if (age <= 25 && isStudent) return true;
  return false;
}

export interface RequiredDoc {
  id: string;
  name: string;
  purpose: string;
  howToObtain: string;
  required: boolean;
  critical?: boolean;
  condition?: string;
  warning?: string;
  group: string;
}

type RawDoc = {
  id: string;
  name: string;
  purpose: string;
  howToObtain: string;
  required: boolean;
  critical?: boolean;
  condition?: string;
};

export function getRequiredDocuments(
  clientType: ClientType,
  familyMembers: FamilyMember[]
): RequiredDoc[] {
  const docsConfig = config.requiredDocuments as Record<string, unknown>;
  const rawHolderDocs = docsConfig[clientType] as RawDoc[];
  const hasClavesFiscal = rawHolderDocs.some((d) => d.id === "CLAVE_FISCAL");

  const holderDocs: RequiredDoc[] = rawHolderDocs
    .filter((d) => {
      if (d.condition === "no_clave_fiscal") return !hasClavesFiscal;
      return true;
    })
    .map((d) => ({ ...d, group: "Titular" }));

  const seenBaseIds = new Set<string>(holderDocs.map((d) => d.id));
  const result: RequiredDoc[] = [...holderDocs];

  if (familyMembers.length > 0) {
    const commonDocs = config.familyCommonDocuments as RawDoc[];
    for (const doc of commonDocs) {
      if (!seenBaseIds.has(doc.id)) {
        seenBaseIds.add(doc.id);
        result.push({ ...doc, group: "Grupo Familiar (común)" });
      }
    }

    const familyDocsSource = docsConfig.family_members as Record<string, RawDoc[]>;
    familyMembers.forEach((member) => {
      let memberDocKey: string = member.type;
      if (member.type === "child" && member.age > 21 && member.isStudent) {
        memberDocKey = "student_child";
      }
      const memberName = member.name || memberLabel(member.type);
      const memberDocs = familyDocsSource[memberDocKey] ?? familyDocsSource[member.type] ?? [];
      const seenMemberDocIds = new Set<string>();
      memberDocs.forEach((d) => {
        if (!seenMemberDocIds.has(d.id)) {
          seenMemberDocIds.add(d.id);
          result.push({
            ...d,
            id: `${d.id}_${member.id}`,
            name: `${d.name} — ${memberName}`,
            group: memberName,
          });
        }
      });
      if (member.type === "child" && member.age > 21 && member.age <= 25 && !member.isStudent) {
        result.push({
          id: `WARNING_ESTUDIANTE_${member.id}`,
          name: `Verificar condición estudiantil — ${memberName}`,
          purpose: `${memberName} tiene ${member.age} años. Sin certificado de estudiante, la cobertura no aplica para mayores de 21.`,
          howToObtain: "Confirmar con el titular si el hijo es estudiante y agregar certificado de facultad o institución educativa.",
          required: true,
          critical: true,
          warning: "ambiguous_student",
          group: memberName,
        });
      }
    });
  }

  return result;
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
    maximumFractionDigits: 2,
  }).format(amount);
}

export function getFamilyMemberLabel(type: FamilyMemberType): string {
  return {
    spouse: "Cónyuge",
    concubine: "Concubino/a",
    child: "Hijo/a",
  }[type];
}
