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
src/                               # Encounter validator source + tests
```

## Commands

- `npm test` — Run Jest tests (encounter validator)
- `npm run validate-skill` — Check SKILL.md against skill spec conventions
- `npm run validate-encounter -- '<JSON>'` — Validate an encounter

## Editing the Skill

When modifying `skills/daggerheart/SKILL.md`, run `npm run validate-skill` afterward to confirm it stays within conventions (line count, token estimate, frontmatter validity, file references).
