import type {
  AdversaryType,
  Tier,
  EncounterInput,
  EncounterReport,
  Severity,
  ValidationIssue,
} from "./types";

/**
 * Battle point cost per adversary type.
 * SRD: Minion group = 1, Social/Support = 1, Horde/Ranged/Skulk/Standard = 2,
 *       Leader = 3, Bruiser = 4, Solo = 5.
 */
const ADVERSARY_COST: Record<AdversaryType, number> = {
  Minion: 1,
  Social: 1,
  Support: 1,
  Horde: 2,
  Ranged: 2,
  Skulk: 2,
  Standard: 2,
  Leader: 3,
  Bruiser: 4,
  Solo: 5,
};

/**
 * SRD benchmark stats per tier.
 * Used to validate that adversary stat blocks are consistent with their declared tier.
 */
const TIER_BENCHMARKS: Record<
  Tier,
  {
    attackMod: [number, number];
    difficulty: [number, number];
    thresholdMajor: [number, number];
    thresholdSevere: [number, number];
  }
> = {
  1: { attackMod: [-4, 4], difficulty: [10, 15], thresholdMajor: [4, 9], thresholdSevere: [8, 17] },
  2: { attackMod: [-2, 5], difficulty: [13, 16], thresholdMajor: [8, 12], thresholdSevere: [16, 25] },
  3: { attackMod: [0, 6], difficulty: [15, 19], thresholdMajor: [15, 25], thresholdSevere: [25, 40] },
  4: { attackMod: [1, 8], difficulty: [18, 22], thresholdMajor: [20, 30], thresholdSevere: [35, 55] },
};

/** Level ranges for each tier per SRD. */
const TIER_LEVELS: Record<Tier, string> = {
  1: "1",
  2: "2–4",
  3: "5–7",
  4: "8–10",
};

/**
 * Compute the base battle point budget for a party.
 * SRD formula: (3 × numPCs) + 2
 */
export function baseBudget(numPCs: number): number {
  return 3 * numPCs + 2;
}

/**
 * Apply SRD modifier adjustments to the base budget.
 */
export function adjustedBudget(input: EncounterInput): number {
  let budget = baseBudget(input.party.numPCs);
  const m = input.modifiers ?? {};

  if (m.easier) budget -= 1;
  if (m.harder) budget += 2;

  // Count solos
  const soloCount = input.adversaries
    .filter((e) => e.adversary.type === "Solo")
    .reduce((sum, e) => sum + e.count, 0);
  if (m.multiSolo || soloCount >= 2) budget -= 2;

  if (m.boostedDamage) budget -= 2;

  // +1 if no heavy hitters (Bruiser, Horde, Leader, Solo)
  const hasHeavy = input.adversaries.some((e) =>
    ["Bruiser", "Horde", "Leader", "Solo"].includes(e.adversary.type)
  );
  if (!hasHeavy) budget += 1;

  // +1 for each adversary from a lower tier than the party
  for (const entry of input.adversaries) {
    if (entry.adversary.tier < input.party.tier) {
      budget += 1 * entry.count;
    }
  }

  return budget;
}

/** Cost to add one instance of an adversary type. */
export function adversaryCost(type: AdversaryType): number {
  return ADVERSARY_COST[type];
}

/** Total battle points spent on all adversaries in the encounter. */
export function totalCostSpent(input: EncounterInput): number {
  return input.adversaries.reduce(
    (sum, entry) => sum + adversaryCost(entry.adversary.type) * entry.count,
    0
  );
}

/**
 * Map budget usage ratio to a human-readable severity.
 *   spent/budget <= 0.5  → trivial
 *   spent/budget <= 0.8  → easy
 *   spent/budget <= 1.1  → balanced
 *   spent/budget <= 1.4  → hard
 *   spent/budget > 1.4   → deadly
 */
export function deriveSeverity(spent: number, budget: number): Severity {
  if (budget <= 0) return "deadly";
  const ratio = spent / budget;
  if (ratio <= 0.5) return "trivial";
  if (ratio <= 0.8) return "easy";
  if (ratio <= 1.1) return "balanced";
  if (ratio <= 1.4) return "hard";
  return "deadly";
}

/** Run stat-block sanity checks against tier benchmarks. */
function validateStatBlocks(input: EncounterInput): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const entry of input.adversaries) {
    const a = entry.adversary;
    const bench = TIER_BENCHMARKS[a.tier];
    const prefix = `${a.name} (Tier ${a.tier} ${a.type})`;

    if (a.attackModifier < bench.attackMod[0] || a.attackModifier > bench.attackMod[1]) {
      issues.push({
        level: "warning",
        message: `${prefix}: attack modifier ${a.attackModifier} outside tier ${a.tier} range [${bench.attackMod[0]}, ${bench.attackMod[1]}]`,
      });
    }

    if (a.difficulty < bench.difficulty[0] || a.difficulty > bench.difficulty[1]) {
      issues.push({
        level: "warning",
        message: `${prefix}: difficulty ${a.difficulty} outside tier ${a.tier} range [${bench.difficulty[0]}, ${bench.difficulty[1]}]`,
      });
    }

    if (a.thresholds) {
      if (a.thresholds.major < bench.thresholdMajor[0] || a.thresholds.major > bench.thresholdMajor[1]) {
        issues.push({
          level: "warning",
          message: `${prefix}: major threshold ${a.thresholds.major} outside tier ${a.tier} range [${bench.thresholdMajor[0]}, ${bench.thresholdMajor[1]}]`,
        });
      }
      if (a.thresholds.severe < bench.thresholdSevere[0] || a.thresholds.severe > bench.thresholdSevere[1]) {
        issues.push({
          level: "warning",
          message: `${prefix}: severe threshold ${a.thresholds.severe} outside tier ${a.tier} range [${bench.thresholdSevere[0]}, ${bench.thresholdSevere[1]}]`,
        });
      }
    }

    // Tier mismatch with party
    if (a.tier > input.party.tier) {
      issues.push({
        level: "error",
        message: `${prefix}: adversary tier ${a.tier} exceeds party tier ${input.party.tier} (levels ${TIER_LEVELS[input.party.tier]}). This will likely be too dangerous.`,
      });
    }
  }

  return issues;
}

/** Validate encounter composition (type mix, budget). */
function validateComposition(input: EncounterInput, budget: number, spent: number): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (spent > budget) {
    issues.push({
      level: "error",
      message: `Over budget: spending ${spent} of ${budget} battle points (${spent - budget} over). Encounter is harder than intended.`,
    });
  }

  if (spent <= 0) {
    issues.push({
      level: "error",
      message: "No adversaries in the encounter.",
    });
  }

  // Warn if all adversaries are the same type
  const types = new Set(input.adversaries.map((e) => e.adversary.type));
  if (types.size === 1 && input.adversaries.length > 1) {
    issues.push({
      level: "warning",
      message: `All adversaries are ${[...types][0]}s. Mixing types creates more dynamic combat.`,
    });
  }

  // Warn on solo-heavy compositions
  const soloCount = input.adversaries
    .filter((e) => e.adversary.type === "Solo")
    .reduce((sum, e) => sum + e.count, 0);
  if (soloCount >= 2 && !input.modifiers?.multiSolo) {
    issues.push({
      level: "warning",
      message: `${soloCount} Solo adversaries detected. SRD recommends -2 budget adjustment for 2+ Solos.`,
    });
  }

  // Minion groups should equal party size per SRD
  const minionEntries = input.adversaries.filter((e) => e.adversary.type === "Minion");
  if (minionEntries.length > 0) {
    issues.push({
      level: "warning",
      message: `Reminder: each Minion group costs 1 BP and should contain ${input.party.numPCs} minions (equal to party size).`,
    });
  }

  return issues;
}

/**
 * Validate an encounter and produce a deterministic report.
 * This is the main entry point agents should call.
 */
export function validateEncounter(input: EncounterInput): EncounterReport {
  const budget = adjustedBudget(input);
  const spent = totalCostSpent(input);
  const remaining = budget - spent;
  const severity = deriveSeverity(spent, budget);

  const costBreakdown = input.adversaries.map((entry) => {
    const costEach = adversaryCost(entry.adversary.type);
    return {
      name: entry.adversary.name,
      type: entry.adversary.type,
      count: entry.count,
      costEach,
      costTotal: costEach * entry.count,
    };
  });

  const issues = [
    ...validateStatBlocks(input),
    ...validateComposition(input, budget, spent),
  ];

  const errorCount = issues.filter((i) => i.level === "error").length;
  const warningCount = issues.filter((i) => i.level === "warning").length;

  const summary =
    `Encounter for ${input.party.numPCs} PCs (Tier ${input.party.tier}): ` +
    `${spent}/${budget} BP spent, ${severity.toUpperCase()} difficulty. ` +
    `${errorCount} error(s), ${warningCount} warning(s).` +
    (errorCount > 0 ? " REQUIRES REVISION." : warningCount > 0 ? " Review warnings." : " Looks good.");

  return {
    budgetTotal: budget,
    budgetSpent: spent,
    budgetRemaining: remaining,
    severity,
    costBreakdown,
    issues,
    summary,
  };
}
