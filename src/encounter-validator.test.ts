import {
  baseBudget,
  adjustedBudget,
  adversaryCost,
  totalCostSpent,
  deriveSeverity,
  validateEncounter,
} from "./encounter-validator";
import type { Adversary, EncounterInput, Tier } from "./types";

// --- Helpers to build test fixtures ---

function makeAdversary(overrides: Partial<Adversary> = {}): Adversary {
  return {
    name: "Test Adversary",
    tier: 1,
    type: "Standard",
    difficulty: 11,
    thresholds: { major: 7, severe: 12 },
    hp: 5,
    stress: 2,
    attackModifier: 1,
    damageNotation: "1d8+2 phy",
    ...overrides,
  };
}

function makeEncounter(overrides: Partial<EncounterInput> = {}): EncounterInput {
  return {
    party: { numPCs: 4, tier: 1 },
    adversaries: [],
    ...overrides,
  };
}

// --- baseBudget ---

describe("baseBudget", () => {
  it("returns (3 * numPCs) + 2", () => {
    expect(baseBudget(3)).toBe(11);
    expect(baseBudget(4)).toBe(14);
    expect(baseBudget(5)).toBe(17);
  });

  it("handles minimum party of 2", () => {
    expect(baseBudget(2)).toBe(8);
  });
});

// --- adversaryCost ---

describe("adversaryCost", () => {
  it("returns 1 for Minion, Social, Support", () => {
    expect(adversaryCost("Minion")).toBe(1);
    expect(adversaryCost("Social")).toBe(1);
    expect(adversaryCost("Support")).toBe(1);
  });

  it("returns 2 for Horde, Ranged, Skulk, Standard", () => {
    expect(adversaryCost("Horde")).toBe(2);
    expect(adversaryCost("Ranged")).toBe(2);
    expect(adversaryCost("Skulk")).toBe(2);
    expect(adversaryCost("Standard")).toBe(2);
  });

  it("returns 3 for Leader", () => {
    expect(adversaryCost("Leader")).toBe(3);
  });

  it("returns 4 for Bruiser", () => {
    expect(adversaryCost("Bruiser")).toBe(4);
  });

  it("returns 5 for Solo", () => {
    expect(adversaryCost("Solo")).toBe(5);
  });
});

// --- adjustedBudget ---

describe("adjustedBudget", () => {
  it("returns base budget with no modifiers and standard adversaries", () => {
    const input = makeEncounter({
      adversaries: [{ adversary: makeAdversary({ type: "Bruiser" }), count: 1 }],
    });
    expect(adjustedBudget(input)).toBe(14);
  });

  it("subtracts 1 for easier modifier", () => {
    const input = makeEncounter({
      adversaries: [{ adversary: makeAdversary({ type: "Bruiser" }), count: 1 }],
      modifiers: { easier: true },
    });
    expect(adjustedBudget(input)).toBe(13);
  });

  it("adds 2 for harder modifier", () => {
    const input = makeEncounter({
      adversaries: [{ adversary: makeAdversary({ type: "Bruiser" }), count: 1 }],
      modifiers: { harder: true },
    });
    expect(adjustedBudget(input)).toBe(16);
  });

  it("subtracts 2 for 2+ Solo adversaries", () => {
    const input = makeEncounter({
      adversaries: [{ adversary: makeAdversary({ type: "Solo" }), count: 2 }],
    });
    // base 14, -2 for multi-solo = 12
    expect(adjustedBudget(input)).toBe(12);
  });

  it("subtracts 2 for boosted damage", () => {
    const input = makeEncounter({
      adversaries: [{ adversary: makeAdversary({ type: "Bruiser" }), count: 1 }],
      modifiers: { boostedDamage: true },
    });
    // base 14, -2 boosted = 12 (Bruiser present so no +1 for no heavy)
    expect(adjustedBudget(input)).toBe(12);
  });

  it("adds 1 when no heavy hitters (Bruiser/Horde/Leader/Solo)", () => {
    const input = makeEncounter({
      adversaries: [
        { adversary: makeAdversary({ type: "Standard" }), count: 2 },
        { adversary: makeAdversary({ type: "Skulk" }), count: 1 },
      ],
    });
    // base 14, +1 no heavy = 15
    expect(adjustedBudget(input)).toBe(15);
  });

  it("adds 1 per lower-tier adversary count", () => {
    const input = makeEncounter({
      party: { numPCs: 4, tier: 2 },
      adversaries: [
        { adversary: makeAdversary({ tier: 1, type: "Bruiser" }), count: 2 },
      ],
    });
    // base 14, +2 for 2 lower-tier = 16
    expect(adjustedBudget(input)).toBe(16);
  });

  it("stacks multiple modifiers correctly", () => {
    const input = makeEncounter({
      party: { numPCs: 3, tier: 2 },
      adversaries: [
        { adversary: makeAdversary({ tier: 1, type: "Standard" }), count: 3 },
      ],
      modifiers: { easier: true },
    });
    // base 11, -1 easier, +1 no heavy, +3 lower-tier = 14
    expect(adjustedBudget(input)).toBe(14);
  });
});

// --- totalCostSpent ---

describe("totalCostSpent", () => {
  it("sums costs for mixed adversary types", () => {
    const input = makeEncounter({
      adversaries: [
        { adversary: makeAdversary({ type: "Bruiser" }), count: 1 },     // 4
        { adversary: makeAdversary({ type: "Minion" }), count: 2 },      // 2
        { adversary: makeAdversary({ type: "Standard" }), count: 1 },    // 2
        { adversary: makeAdversary({ type: "Leader" }), count: 1 },      // 3
      ],
    });
    expect(totalCostSpent(input)).toBe(11);
  });

  it("returns 0 for empty encounter", () => {
    expect(totalCostSpent(makeEncounter())).toBe(0);
  });
});

// --- deriveSeverity ---

describe("deriveSeverity", () => {
  it("returns trivial when ratio <= 0.5", () => {
    expect(deriveSeverity(5, 14)).toBe("trivial");
  });

  it("returns easy when ratio <= 0.8", () => {
    expect(deriveSeverity(10, 14)).toBe("easy");
  });

  it("returns balanced when ratio <= 1.1", () => {
    expect(deriveSeverity(14, 14)).toBe("balanced");
    expect(deriveSeverity(15, 14)).toBe("balanced");
  });

  it("returns hard when ratio <= 1.4", () => {
    expect(deriveSeverity(19, 14)).toBe("hard");
  });

  it("returns deadly when ratio > 1.4", () => {
    expect(deriveSeverity(21, 14)).toBe("deadly");
  });

  it("returns deadly when budget is 0", () => {
    expect(deriveSeverity(5, 0)).toBe("deadly");
  });

  it("returns trivial at exactly 0.5 ratio", () => {
    expect(deriveSeverity(7, 14)).toBe("trivial");
  });
});

// --- validateEncounter: full integration ---

describe("validateEncounter", () => {
  it("produces a balanced report for a well-built Tier 1 encounter (4 PCs)", () => {
    // Classic SRD example: 1 Bruiser (Bear) + 2 Standard (Skeleton Warriors) + 1 Minion group
    const input = makeEncounter({
      adversaries: [
        {
          adversary: makeAdversary({
            name: "Bear",
            type: "Bruiser",
            difficulty: 14,
            thresholds: { major: 9, severe: 17 },
            hp: 7,
            stress: 2,
            attackModifier: 1,
            damageNotation: "1d8+3 phy",
          }),
          count: 1, // 4 BP
        },
        {
          adversary: makeAdversary({
            name: "Skeleton Warrior",
            type: "Standard",
            difficulty: 11,
            thresholds: { major: 5, severe: 10 },
            hp: 5,
            stress: 2,
            attackModifier: 1,
            damageNotation: "1d8+2 phy",
          }),
          count: 2, // 4 BP
        },
        {
          adversary: makeAdversary({
            name: "Rotted Zombie",
            type: "Minion",
            difficulty: 11,
            thresholds: null,
            hp: 1,
            stress: 1,
            attackModifier: 0,
            damageNotation: "3 phy",
          }),
          count: 1, // 1 BP (group of 4 zombies)
        },
      ],
    });

    const report = validateEncounter(input);
    expect(report.budgetTotal).toBe(14); // (3*4)+2
    expect(report.budgetSpent).toBe(9);  // 4+4+1
    expect(report.budgetRemaining).toBe(5);
    expect(report.severity).toBe("easy");
    expect(report.costBreakdown).toHaveLength(3);
    expect(report.issues.filter((i) => i.level === "error")).toHaveLength(0);
    expect(report.summary).toContain("EASY");
  });

  it("flags over-budget encounters as errors", () => {
    const input = makeEncounter({
      party: { numPCs: 3, tier: 1 },
      adversaries: [
        { adversary: makeAdversary({ type: "Solo", name: "Cave Ogre" }), count: 1 },  // 5
        { adversary: makeAdversary({ type: "Bruiser", name: "Bear" }), count: 2 },     // 8
      ],
    });
    // base 11, no adjustments since has heavy hitters
    const report = validateEncounter(input);
    expect(report.budgetSpent).toBe(13);
    expect(report.budgetTotal).toBe(11);
    expect(report.issues.some((i) => i.level === "error" && i.message.includes("Over budget"))).toBe(true);
    expect(report.severity).toBe("hard");
    expect(report.summary).toContain("REQUIRES REVISION");
  });

  it("flags adversaries above party tier as errors", () => {
    const input = makeEncounter({
      party: { numPCs: 4, tier: 1 },
      adversaries: [
        {
          adversary: makeAdversary({
            name: "Hydra",
            tier: 3,
            type: "Solo",
            difficulty: 17,
            thresholds: { major: 20, severe: 35 },
            hp: 10,
            attackModifier: 5,
          }),
          count: 1,
        },
      ],
    });

    const report = validateEncounter(input);
    expect(report.issues.some((i) => i.level === "error" && i.message.includes("exceeds party tier"))).toBe(true);
    expect(report.summary).toContain("REQUIRES REVISION");
  });

  it("warns on stat blocks outside tier benchmarks", () => {
    const input = makeEncounter({
      adversaries: [
        {
          adversary: makeAdversary({
            name: "Weird Homebrew",
            tier: 1,
            type: "Standard",
            difficulty: 25,       // way too high for Tier 1
            attackModifier: 10,   // way too high
            thresholds: { major: 30, severe: 50 },
          }),
          count: 1,
        },
      ],
    });

    const report = validateEncounter(input);
    const warnings = report.issues.filter((i) => i.level === "warning");
    expect(warnings.length).toBeGreaterThanOrEqual(3); // difficulty, attack mod, thresholds
    expect(warnings.some((w) => w.message.includes("difficulty 25 outside tier 1"))).toBe(true);
    expect(warnings.some((w) => w.message.includes("attack modifier 10 outside tier 1"))).toBe(true);
  });

  it("warns when all adversaries are the same type", () => {
    const input = makeEncounter({
      adversaries: [
        { adversary: makeAdversary({ name: "Guard A", type: "Standard" }), count: 1 },
        { adversary: makeAdversary({ name: "Guard B", type: "Standard" }), count: 1 },
      ],
    });

    const report = validateEncounter(input);
    expect(report.issues.some((i) => i.message.includes("All adversaries are Standards"))).toBe(true);
  });

  it("reminds about minion group sizing", () => {
    const input = makeEncounter({
      adversaries: [
        { adversary: makeAdversary({ type: "Minion", name: "Lackeys" }), count: 2 },
        { adversary: makeAdversary({ type: "Leader", name: "Boss" }), count: 1 },
      ],
    });

    const report = validateEncounter(input);
    expect(report.issues.some((i) => i.message.includes("Minion group"))).toBe(true);
  });

  it("correctly handles a 5-PC Tier 2 harder encounter", () => {
    const input: EncounterInput = {
      party: { numPCs: 5, tier: 2 },
      adversaries: [
        {
          adversary: {
            name: "Master Assassin",
            tier: 2,
            type: "Leader",
            difficulty: 15,
            thresholds: { major: 12, severe: 25 },
            hp: 7,
            stress: 5,
            attackModifier: 5,
            damageNotation: "2d10+2 phy",
          },
          count: 1, // 3 BP
        },
        {
          adversary: {
            name: "Apprentice Assassin",
            tier: 2,
            type: "Minion",
            difficulty: 13,
            thresholds: null,
            hp: 1,
            stress: 1,
            attackModifier: -1,
            damageNotation: "4 phy",
          },
          count: 2, // 2 BP (2 groups of 5)
        },
        {
          adversary: {
            name: "Assassin Poisoner",
            tier: 2,
            type: "Skulk",
            difficulty: 14,
            thresholds: { major: 8, severe: 16 },
            hp: 4,
            stress: 4,
            attackModifier: 3,
            damageNotation: "2d8+1 phy",
          },
          count: 3, // 6 BP
        },
        {
          adversary: {
            name: "Archer Squadron",
            tier: 2,
            type: "Horde",
            difficulty: 13,
            thresholds: { major: 8, severe: 16 },
            hp: 4,
            stress: 3,
            attackModifier: 0,
            damageNotation: "2d6+3 phy",
          },
          count: 1, // 2 BP
        },
      ],
      modifiers: { harder: true },
    };

    const report = validateEncounter(input);
    // base = (3*5)+2 = 17, +2 harder = 19
    expect(report.budgetTotal).toBe(19);
    // spent = 3 + 2 + 6 + 2 = 13
    expect(report.budgetSpent).toBe(13);
    expect(report.severity).toBe("easy");
    expect(report.issues.filter((i) => i.level === "error")).toHaveLength(0);
  });

  it("deterministic: same input always produces same output", () => {
    const input = makeEncounter({
      adversaries: [
        { adversary: makeAdversary({ type: "Solo", name: "Construct" }), count: 1 },
        { adversary: makeAdversary({ type: "Standard", name: "Guard" }), count: 2 },
        { adversary: makeAdversary({ type: "Minion", name: "Rats" }), count: 1 },
      ],
    });

    const r1 = validateEncounter(input);
    const r2 = validateEncounter(input);
    expect(r1).toEqual(r2);
  });

  it("returns clean summary when no issues", () => {
    // Exactly balanced: 14 BP budget, spend exactly 14
    const input = makeEncounter({
      adversaries: [
        { adversary: makeAdversary({ type: "Solo", name: "Cave Ogre" }), count: 1 },   // 5
        { adversary: makeAdversary({ type: "Bruiser", name: "Bear" }), count: 1 },      // 4
        { adversary: makeAdversary({ type: "Standard", name: "Guard" }), count: 1 },    // 2
        { adversary: makeAdversary({ type: "Leader", name: "Captain" }), count: 1 },    // 3
      ],
    });

    const report = validateEncounter(input);
    expect(report.budgetTotal).toBe(14);
    expect(report.budgetSpent).toBe(14);
    expect(report.severity).toBe("balanced");
    expect(report.summary).toContain("BALANCED");
  });
});
