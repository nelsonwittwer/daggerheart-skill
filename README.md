# Daggerheart Skill

An AI agent skill for running [Daggerheart](https://www.daggerheart.com/) tabletop RPG sessions. Provides structured rules reference and a deterministic encounter validator that agents use to self-check encounter balance before recommending to the GM.

## What's Included

### Rules Reference (`docs/`)

47 markdown files covering the full Daggerheart SRD, split by topic for fast agent lookup:

- Classes, ancestries, communities
- Core mechanics, combat, conditions
- Equipment tables (weapons, armor, loot, consumables)
- GM guidance and difficulty benchmarks
- 100+ adversary stat blocks across 4 tiers
- Environment stat blocks
- Domain card references (all 9 domains)
- The Witherwild campaign frame

### Encounter Validator (`src/`)

A TypeScript validation engine that agents run to verify encounter balance. Given a party and a set of adversaries, it produces a deterministic report:

- **Battle Point budget** — `(3 × numPCs) + 2` with all SRD modifier adjustments
- **Severity rating** — trivial / easy / balanced / hard / deadly
- **Stat block validation** — checks against tier benchmarks
- **Composition analysis** — type mix, tier mismatches, warnings

### Agent Instructions (`CLAUDE.md`)

Tells the agent how to look up rules, build encounters, and — critically — validates every encounter through the script before presenting it.

## Setup

```bash
npm install
npm test       # 33 tests
npm run build  # compile TypeScript
```

## Usage

Start a Claude Code session from this directory. The `CLAUDE.md` will be picked up automatically, giving the agent access to the full rules reference and the encounter validation workflow.

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
