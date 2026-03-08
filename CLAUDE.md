# Daggerheart Skill — Project Instructions

This is a Claude Code plugin. The skill and all its assets live in `skills/daggerheart/`.

## Project Structure

```
.claude-plugin/
  plugin.json                      # Plugin manifest for official marketplace
skills/
  daggerheart/
    SKILL.md                       # Main skill file (frontmatter + instructions)
    encounter-schema.md            # Supporting: validator input/output schema
    docs/                          # SRD reference (47 markdown files)
    scripts/
      validate-encounter.ts        # CLI: validate an encounter JSON
      validate-skill.ts            # CLI: validate SKILL.md against conventions
scripts/
  init-campaign.ts                 # CLI: scaffold a new campaign directory
  create-pc.ts                     # CLI: save a PC JSON from character creation
  new-session.ts                   # CLI: create numbered session notes
src/
  types.ts                         # Encounter + Campaign + PC types
  encounter-validator.ts           # Encounter validation engine + tests
  campaign.ts                      # Campaign pure functions + tests
```

## Commands

- `npm test` — Run Jest tests (65 tests: encounter validator + campaign functions)
- `npm run validate-skill` — Check SKILL.md against skill spec conventions
- `npm run validate-encounter -- '<JSON>'` — Validate an encounter
- `npm run init-campaign -- '<name>' <num-pcs> [tier]` — Scaffold a campaign directory
- `npm run create-pc -- '<campaign>' '<PC JSON>'` — Save a PC JSON file
- `npm run new-session -- '<campaign>'` — Create a new session notes file

## Editing the Skill

When modifying `skills/daggerheart/SKILL.md`, run `npm run validate-skill` afterward to confirm it stays within conventions (line count, token estimate, frontmatter validity, file references).
