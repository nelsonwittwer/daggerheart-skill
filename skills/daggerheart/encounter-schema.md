# Encounter Validator Schema

## Input JSON

```json
{
  "party": { "numPCs": 4, "tier": 1 },
  "adversaries": [
    {
      "adversary": {
        "name": "Bear",
        "tier": 1,
        "type": "Bruiser",
        "difficulty": 14,
        "thresholds": { "major": 9, "severe": 17 },
        "hp": 7,
        "stress": 2,
        "attackModifier": 1,
        "damageNotation": "1d8+3 phy"
      },
      "count": 1
    }
  ],
  "modifiers": {
    "easier": false,
    "harder": false,
    "multiSolo": false,
    "boostedDamage": false
  }
}
```

## Field Reference

### party
- `numPCs`: Number of player characters (2-5)
- `tier`: Party tier (1-4). Tier 1 = level 1, Tier 2 = levels 2-4, Tier 3 = levels 5-7, Tier 4 = levels 8-10.

### adversaries[]
Each entry has:
- `adversary.name`: Adversary name from the stat block
- `adversary.tier`: 1-4, from the stat block
- `adversary.type`: One of: Bruiser, Horde, Leader, Minion, Ranged, Skulk, Social, Solo, Standard, Support
- `adversary.difficulty`: The difficulty number from the stat block
- `adversary.thresholds`: `{ "major": N, "severe": N }` or `null` for Minions
- `adversary.hp`: Hit points from the stat block
- `adversary.stress`: Stress from the stat block
- `adversary.attackModifier`: ATK modifier from the stat block
- `adversary.damageNotation`: Damage string, e.g. "2d8+3 phy"
- `count`: Number of this adversary. For Minions, this is the number of groups (each group = party size).

### modifiers (optional)
- `easier`: GM wants an easier/shorter fight (-1 BP)
- `harder`: GM wants a harder/longer fight (+2 BP)
- `multiSolo`: Using 2+ Solo adversaries (-2 BP)
- `boostedDamage`: Adding +1d4 or static +2 to all adversary damage (-2 BP)

## Output

The validator returns a JSON report:

```json
{
  "budgetTotal": 14,
  "budgetSpent": 9,
  "budgetRemaining": 5,
  "severity": "easy",
  "costBreakdown": [
    { "name": "Bear", "type": "Bruiser", "count": 1, "costEach": 4, "costTotal": 4 }
  ],
  "issues": [
    { "level": "warning", "message": "..." }
  ],
  "summary": "Encounter for 4 PCs (Tier 1): 9/14 BP spent, EASY difficulty. 0 error(s), 1 warning(s). Review warnings."
}
```

### Severity Levels
- **trivial**: spent/budget <= 0.5
- **easy**: spent/budget <= 0.8
- **balanced**: spent/budget <= 1.1
- **hard**: spent/budget <= 1.4
- **deadly**: spent/budget > 1.4

If `summary` contains "REQUIRES REVISION", the encounter has errors and must be adjusted.
