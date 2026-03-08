import type { Campaign, PlayerCharacter, Tier } from "./types";

// ── Validation ──

export function validateCampaignName(name: string): string | null {
  if (!name) return "Campaign name is required.";
  if (!/^[a-z0-9][a-z0-9-]*$/.test(name))
    return "Campaign name must be lowercase-kebab-case (e.g. 'forest-of-whispers').";
  return null;
}

export function validateNumPCs(numPCs: number): string | null {
  if (isNaN(numPCs) || numPCs < 1) return "Number of PCs must be at least 1.";
  if (numPCs > 8) return "Max 8 PCs supported.";
  return null;
}

export function validateTier(tier: number): string | null {
  if (![1, 2, 3, 4].includes(tier)) return "Tier must be 1-4.";
  return null;
}

const PC_REQUIRED_FIELDS: (keyof PlayerCharacter)[] = [
  "name", "player", "class", "subclass", "ancestry", "community", "traits",
  "level", "evasion", "hp", "hpMax", "stress", "stressMax", "hope",
  "weapons", "armor", "proficiency", "experiences", "domainCards",
];

export function validatePC(pc: Partial<PlayerCharacter>): string[] {
  return PC_REQUIRED_FIELDS.filter(
    (key) => pc[key] === undefined || pc[key] === null,
  );
}

// ── Data builders ──

export function buildCampaign(name: string, numPCs: number, tier: Tier, date: string): Campaign {
  return {
    name,
    tier,
    numPCs,
    createdAt: date,
    pcs: [],
    sessionCount: 0,
  };
}

export function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function addPCToCampaign(campaign: Campaign, slug: string): Campaign {
  if (campaign.pcs.includes(slug)) return campaign;
  return { ...campaign, pcs: [...campaign.pcs, slug] };
}

export function incrementSession(campaign: Campaign): Campaign {
  return { ...campaign, sessionCount: campaign.sessionCount + 1 };
}

export function padSessionNumber(n: number): string {
  return n.toString().padStart(3, "0");
}

// ── Template builders ──

export function buildSessionTemplate(
  sessionNumber: string,
  date: string,
  pcNames: string[],
): string {
  const playerList = pcNames.length > 0
    ? pcNames.map((n) => `- ${n}`).join("\n")
    : "- (no PCs created yet)";

  const hopeTable = pcNames.length > 0
    ? pcNames.map((n) => `| ${n} |  |  |  |`).join("\n")
    : "| (PC) |  |  |  |";

  return `# Session ${sessionNumber}

**Date:** ${date}
**Players present:**
${playerList}

---

## Summary

_Brief overview of what happened this session._

## Encounters

### Encounter 1: [Title]

**Location:**
**Adversaries:**
**Difficulty:** (trivial / easy / balanced / hard / deadly)

#### Round-by-round

- **Round 1:**
- **Round 2:**

#### Outcome

_How did the encounter resolve? Any consequences?_

## Downtime

_Any downtime activities, rests, or leveling that occurred._

## Notes

- Key decisions:
- Unresolved threads:
- Loot acquired:

## Hope & Fear Tracker

| PC | Hope (start) | Hope (end) | Stress marked |
|----|-------------|------------|---------------|
${hopeTable}

## Next Session Setup

_What's the party heading into next?_
`;
}
