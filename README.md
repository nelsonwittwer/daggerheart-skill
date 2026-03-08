# Daggerheart Skill

An AI agent skill for running [Daggerheart](https://www.daggerheart.com/) tabletop RPG sessions. Provides structured rules reference and a deterministic encounter validator that agents use to self-check encounter balance before recommending to the GM.

## What's Included

### Distributable Skill (`skill/`)

The `skill/` directory is self-contained — everything ships together:

```
skill/
  SKILL.md                        # Main skill (88 lines, ~969 tokens)
  encounter-schema.md             # Validator input/output schema reference
  docs/                           # 47 markdown files covering the full SRD
  scripts/
    validate-encounter.ts         # CLI: validate encounter JSON
    validate-skill.ts             # CLI: validate SKILL.md against conventions
```

**Rules reference** (`skill/docs/`): classes, ancestries, communities, core mechanics, combat, equipment, GM guidance, 100+ adversary stat blocks, environments, domain cards, and the Witherwild campaign frame.

### Encounter Validator (`src/`)

A TypeScript validation engine that agents run to verify encounter balance. Given a party and a set of adversaries, it produces a deterministic report:

- **Battle Point budget** — `(3 × numPCs) + 2` with all SRD modifier adjustments
- **Severity rating** — trivial / easy / balanced / hard / deadly
- **Stat block validation** — checks against tier benchmarks
- **Composition analysis** — type mix, tier mismatches, warnings

To install as a personal skill, copy or symlink the `skill/` directory:

```bash
ln -s /path/to/daggerheart-skill/skill ~/.claude/skills/daggerheart
```

## Setup

```bash
npm install
npm test              # 33 tests
npm run build         # compile TypeScript
npm run validate-skill  # check SKILL.md against skill spec
```

## Usage

Start a Claude Code session from this directory. The skill will be available as `/daggerheart` and will auto-trigger on Daggerheart-related questions.

## Source Material

The rules documentation is derived from the **Daggerheart System Reference Document (SRD) 1.0**, available at:

https://www.daggerheart.com/wp-content/uploads/2025/09/Daggerheart-SRD-9-09-25.pdf

## Credits

**Daggerheart** is created by [Critical Role](https://critrole.com/) and published by [Darrington Press](https://darringtonpress.com/).

- SRD Writer: Rob Hebert
- Technical Editor: Shawn Banerjee
- Layout: Matt Paquette & Co.
- Producers: Dani Gage and Madigan Hunt

Copyright 2025 Critical Role LLC. All rights reserved.

This project uses content designated as Public Game Content under the [Darrington Press Community Gaming License](https://www.darringtonpress.com/license).
