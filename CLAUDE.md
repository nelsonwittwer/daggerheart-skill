# Daggerheart Skill — Project Instructions

The distributable skill lives in `skill/`. Everything the skill needs ships inside that directory.

## Project Structure

```
skill/                  # Self-contained distributable skill
  SKILL.md              # Main skill file (frontmatter + instructions)
  encounter-schema.md   # Supporting: validator input/output schema
  docs/                 # SRD reference (47 markdown files)
  scripts/
    validate-encounter.ts  # CLI: validate an encounter JSON
    validate-skill.ts      # CLI: validate SKILL.md against conventions
src/                    # Encounter validator source + tests
```

## Commands

- `npm test` — Run Jest tests (encounter validator)
- `npm run validate-skill` — Check SKILL.md against skill spec conventions
- `npm run validate-encounter -- '<JSON>'` — Validate an encounter

## Editing the Skill

When modifying `skill/SKILL.md`, run `npm run validate-skill` afterward to confirm it stays within conventions (line count, token estimate, frontmatter validity, file references).
