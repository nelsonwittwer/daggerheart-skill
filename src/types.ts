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

// ── Campaign & PC types ──

export type ClassName =
  | "Bard"
  | "Druid"
  | "Guardian"
  | "Ranger"
  | "Rogue"
  | "Seraph"
  | "Sorcerer"
  | "Warrior"
  | "Wizard";

export type Ancestry =
  | "Clank"
  | "Drakona"
  | "Dwarf"
  | "Elf"
  | "Faerie"
  | "Faun"
  | "Firbolg"
  | "Fungril"
  | "Galapa"
  | "Giant"
  | "Goblin"
  | "Halfling"
  | "Human"
  | "Infernis"
  | "Katari"
  | "Orc"
  | "Ribbet"
  | "Simiah"
  | "Mixed";

export type Community =
  | "Highborne"
  | "Loreborne"
  | "Orderborne"
  | "Ridgeborne"
  | "Seaborne"
  | "Slyborne"
  | "Underborne"
  | "Wanderborne"
  | "Wildborne";

export interface Traits {
  agility: number;
  strength: number;
  finesse: number;
  instinct: number;
  presence: number;
  knowledge: number;
}

export interface Weapon {
  name: string;
  trait: keyof Traits;
  range: string;
  damageDice: string;
  hands: "one" | "two";
}

export interface Armor {
  name: string;
  baseScore: number;
  baseThresholds: { major: number; severe: number };
  slots: number;
  feature?: string;
}

export interface Experience {
  name: string;
  modifier: number;
}

export interface DomainCard {
  domain: string;
  name: string;
  level: number;
}

export interface PlayerCharacter {
  // Identity
  name: string;
  pronouns?: string;
  player: string;

  // Step 1: Class & Subclass
  class: ClassName;
  subclass: string;

  // Step 2: Heritage
  ancestry: Ancestry;
  ancestryFeatures: string[];
  community: Community;
  communityFeature: string;

  // Step 3: Traits
  traits: Traits;

  // Step 4: Character Info
  level: number;
  evasion: number;
  hp: number;
  hpMax: number;
  stress: number;
  stressMax: number;
  hope: number;

  // Step 5: Equipment
  weapons: Weapon[];
  armor: Armor;
  proficiency: number;
  inventory: string[];
  gold: number;

  // Step 6: Background
  background: string;

  // Step 7: Experiences
  experiences: Experience[];

  // Step 8: Domain Cards
  domainCards: DomainCard[];

  // Step 9: Connections
  connections: string[];
}

export interface Campaign {
  name: string;
  tier: Tier;
  numPCs: number;
  createdAt: string;
  pcs: string[];
  sessionCount: number;
}

// ── Encounter types ──

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
