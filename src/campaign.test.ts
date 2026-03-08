import {
  validateCampaignName,
  validateNumPCs,
  validateTier,
  validatePC,
  buildCampaign,
  slugify,
  addPCToCampaign,
  incrementSession,
  padSessionNumber,
  buildSessionTemplate,
} from "./campaign";
import type { Campaign, PlayerCharacter } from "./types";

// ── Helpers ──

function makeCampaign(overrides: Partial<Campaign> = {}): Campaign {
  return {
    name: "test-campaign",
    tier: 1,
    numPCs: 4,
    createdAt: "2026-03-08T00:00:00.000Z",
    pcs: [],
    sessionCount: 0,
    ...overrides,
  };
}

function makePC(overrides: Partial<PlayerCharacter> = {}): PlayerCharacter {
  return {
    name: "Thorne Willowmend",
    pronouns: "he/him",
    player: "Nelson",
    class: "Druid",
    subclass: "Warden of the Elements",
    ancestry: "Faun",
    ancestryFeatures: ["Caprine Leap", "Kick"],
    community: "Wildborne",
    communityFeature: "Lightfoot",
    traits: { agility: 1, strength: 0, finesse: 0, instinct: 2, presence: 1, knowledge: -1 },
    level: 1,
    evasion: 10,
    hp: 6,
    hpMax: 6,
    stress: 0,
    stressMax: 6,
    hope: 2,
    weapons: [{ name: "Gnarled Staff", trait: "instinct", range: "Melee", damageDice: "d8+1", hands: "two" }],
    armor: { name: "Hide Armor", baseScore: 2, baseThresholds: { major: 4, severe: 8 }, slots: 3 },
    proficiency: 1,
    inventory: ["Torch", "50 feet of rope"],
    gold: 1,
    background: "A faun druid from an ancient forest.",
    experiences: [{ name: "Survivalist", modifier: 2 }, { name: "Nature's Friend", modifier: 2 }],
    domainCards: [{ domain: "Sage", name: "Speak with Nature", level: 1 }],
    connections: [],
    ...overrides,
  };
}

// ── validateCampaignName ──

describe("validateCampaignName", () => {
  it("returns null for valid kebab-case names", () => {
    expect(validateCampaignName("forest-of-whispers")).toBeNull();
    expect(validateCampaignName("campaign1")).toBeNull();
    expect(validateCampaignName("a")).toBeNull();
  });

  it("rejects empty string", () => {
    expect(validateCampaignName("")).not.toBeNull();
  });

  it("rejects uppercase", () => {
    expect(validateCampaignName("Forest")).not.toBeNull();
  });

  it("rejects leading hyphen", () => {
    expect(validateCampaignName("-forest")).not.toBeNull();
  });

  it("rejects spaces", () => {
    expect(validateCampaignName("my campaign")).not.toBeNull();
  });
});

// ── validateNumPCs ──

describe("validateNumPCs", () => {
  it("returns null for valid range 1-8", () => {
    expect(validateNumPCs(1)).toBeNull();
    expect(validateNumPCs(4)).toBeNull();
    expect(validateNumPCs(8)).toBeNull();
  });

  it("rejects 0", () => {
    expect(validateNumPCs(0)).not.toBeNull();
  });

  it("rejects negative", () => {
    expect(validateNumPCs(-1)).not.toBeNull();
  });

  it("rejects over 8", () => {
    expect(validateNumPCs(9)).not.toBeNull();
  });

  it("rejects NaN", () => {
    expect(validateNumPCs(NaN)).not.toBeNull();
  });
});

// ── validateTier ──

describe("validateTier", () => {
  it("returns null for tiers 1-4", () => {
    expect(validateTier(1)).toBeNull();
    expect(validateTier(2)).toBeNull();
    expect(validateTier(3)).toBeNull();
    expect(validateTier(4)).toBeNull();
  });

  it("rejects 0 and 5", () => {
    expect(validateTier(0)).not.toBeNull();
    expect(validateTier(5)).not.toBeNull();
  });
});

// ── validatePC ──

describe("validatePC", () => {
  it("returns empty array for complete PC", () => {
    expect(validatePC(makePC())).toEqual([]);
  });

  it("returns missing field names", () => {
    const missing = validatePC({ name: "Test" } as Partial<PlayerCharacter>);
    expect(missing).toContain("player");
    expect(missing).toContain("class");
    expect(missing).toContain("traits");
    expect(missing).not.toContain("name");
  });

  it("catches null values as missing", () => {
    const pc = makePC();
    (pc as any).subclass = null;
    expect(validatePC(pc)).toContain("subclass");
  });
});

// ── buildCampaign ──

describe("buildCampaign", () => {
  it("creates campaign with correct fields", () => {
    const c = buildCampaign("test", 4, 1, "2026-03-08T00:00:00.000Z");
    expect(c.name).toBe("test");
    expect(c.numPCs).toBe(4);
    expect(c.tier).toBe(1);
    expect(c.pcs).toEqual([]);
    expect(c.sessionCount).toBe(0);
  });
});

// ── slugify ──

describe("slugify", () => {
  it("lowercases and replaces spaces with hyphens", () => {
    expect(slugify("Thorne Willowmend")).toBe("thorne-willowmend");
  });

  it("strips special characters", () => {
    expect(slugify("O'Brien the 3rd!")).toBe("o-brien-the-3rd");
  });

  it("trims leading/trailing hyphens", () => {
    expect(slugify("  Test Name  ")).toBe("test-name");
  });

  it("collapses multiple separators", () => {
    expect(slugify("a---b   c")).toBe("a-b-c");
  });
});

// ── addPCToCampaign ──

describe("addPCToCampaign", () => {
  it("adds slug to pcs array", () => {
    const c = makeCampaign();
    const updated = addPCToCampaign(c, "thorne-willowmend");
    expect(updated.pcs).toEqual(["thorne-willowmend"]);
  });

  it("does not duplicate existing slug", () => {
    const c = makeCampaign({ pcs: ["thorne-willowmend"] });
    const updated = addPCToCampaign(c, "thorne-willowmend");
    expect(updated.pcs).toEqual(["thorne-willowmend"]);
  });

  it("does not mutate the original campaign", () => {
    const c = makeCampaign();
    addPCToCampaign(c, "new-pc");
    expect(c.pcs).toEqual([]);
  });
});

// ── incrementSession ──

describe("incrementSession", () => {
  it("increments session count by 1", () => {
    const c = makeCampaign({ sessionCount: 3 });
    expect(incrementSession(c).sessionCount).toBe(4);
  });

  it("does not mutate the original campaign", () => {
    const c = makeCampaign({ sessionCount: 0 });
    incrementSession(c);
    expect(c.sessionCount).toBe(0);
  });
});

// ── padSessionNumber ──

describe("padSessionNumber", () => {
  it("pads single digits to 3 chars", () => {
    expect(padSessionNumber(1)).toBe("001");
    expect(padSessionNumber(9)).toBe("009");
  });

  it("pads double digits", () => {
    expect(padSessionNumber(42)).toBe("042");
  });

  it("leaves triple digits as-is", () => {
    expect(padSessionNumber(100)).toBe("100");
  });
});

// ── buildSessionTemplate ──

describe("buildSessionTemplate", () => {
  it("includes session number and date", () => {
    const t = buildSessionTemplate("005", "2026-03-08", []);
    expect(t).toContain("# Session 005");
    expect(t).toContain("**Date:** 2026-03-08");
  });

  it("lists PC names when provided", () => {
    const t = buildSessionTemplate("001", "2026-03-08", ["Thorne", "Renna"]);
    expect(t).toContain("- Thorne");
    expect(t).toContain("- Renna");
    expect(t).toContain("| Thorne |");
    expect(t).toContain("| Renna |");
  });

  it("shows placeholder when no PCs", () => {
    const t = buildSessionTemplate("001", "2026-03-08", []);
    expect(t).toContain("(no PCs created yet)");
    expect(t).toContain("| (PC) |");
  });

  it("includes all required sections", () => {
    const t = buildSessionTemplate("001", "2026-03-08", []);
    expect(t).toContain("## Summary");
    expect(t).toContain("## Encounters");
    expect(t).toContain("## Downtime");
    expect(t).toContain("## Notes");
    expect(t).toContain("## Hope & Fear Tracker");
    expect(t).toContain("## Next Session Setup");
  });
});
