/** Adversary type as defined in the SRD. */
export type AdversaryType =
  | "Bruiser"
  | "Horde"
  | "Leader"
  | "Minion"
  | "Ranged"
  | "Skulk"
  | "Social"
  | "Solo"
  | "Standard"
  | "Support";

export type Tier = 1 | 2 | 3 | 4;

export interface Adversary {
  name: string;
  tier: Tier;
  type: AdversaryType;
  difficulty: number;
  thresholds: { major: number; severe: number } | null; // null for minions
  hp: number;
  stress: number;
  attackModifier: number;
  damageNotation: string; // e.g. "1d12+2 phy"
}

export interface PartyInfo {
  numPCs: number;
  tier: Tier;
}

/** A single adversary entry in an encounter, with a count for minion groups or multiples. */
export interface EncounterEntry {
  adversary: Adversary;
  /** For Minions, this is the number of groups (each group = party size). For others, the count of that adversary. */
  count: number;
}

export interface EncounterInput {
  party: PartyInfo;
  adversaries: EncounterEntry[];
  /** Optional modifiers the GM has declared. */
  modifiers?: EncounterModifiers;
}

export interface EncounterModifiers {
  /** GM wants an easier/shorter fight. */
  easier?: boolean;
  /** GM wants a harder/longer fight. */
  harder?: boolean;
  /** GM is using 2+ Solo adversaries. */
  multiSolo?: boolean;
  /** GM is adding +1d4 (or static +2) to all adversary damage rolls. */
  boostedDamage?: boolean;
}

export type Severity = "trivial" | "easy" | "balanced" | "hard" | "deadly";

export interface ValidationIssue {
  level: "warning" | "error";
  message: string;
}

export interface EncounterReport {
  /** Total battle points available after modifier adjustments. */
  budgetTotal: number;
  /** Battle points spent on the selected adversaries. */
  budgetSpent: number;
  /** Remaining (positive = under budget, negative = over budget). */
  budgetRemaining: number;
  /** Human-readable difficulty rating derived from budget usage. */
  severity: Severity;
  /** Per-adversary cost breakdown. */
  costBreakdown: { name: string; type: AdversaryType; count: number; costEach: number; costTotal: number }[];
  /** Any warnings or errors found during validation. */
  issues: ValidationIssue[];
  /** One-line summary suitable for agent self-check. */
  summary: string;
}
