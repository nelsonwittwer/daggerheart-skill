"""Split cleaned Daggerheart SRD text into structured markdown documentation."""

import os
import re

INPUT_PATH = "cleaned_text.txt"
DOCS_DIR = "docs"

# Section definitions: (output_filename, start_line, end_line, title)
# Lines are 1-indexed to match the cleaned_text.txt file
SECTIONS = [
    ("00-index.md", None, None, "Daggerheart SRD — Agent Reference Index"),
    ("01-introduction.md", 1, 140, "Introduction & The Basics"),
    ("02-character-creation.md", 141, 373, "Character Creation"),
    ("03-domains-overview.md", 374, 527, "Domains Overview"),
    ("04-classes-bard.md", 528, 657, "Class: Bard"),
    ("05-classes-druid.md", 658, 777, "Class: Druid"),
    ("06-classes-druid-beastforms.md", 778, 1084, "Druid Beastforms"),
    ("07-classes-guardian.md", 1085, 1189, "Class: Guardian"),
    ("08-classes-ranger.md", 1190, 1372, "Class: Ranger & Companion"),
    ("09-classes-rogue.md", 1373, 1496, "Class: Rogue"),
    ("10-classes-seraph.md", 1497, 1596, "Class: Seraph"),
    ("11-classes-sorcerer.md", 1597, 1700, "Class: Sorcerer"),
    ("12-classes-warrior.md", 1701, 1805, "Class: Warrior"),
    ("13-classes-wizard.md", 1805, 1907, "Class: Wizard"),
    ("14-ancestries.md", 1907, 2348, "Ancestries"),
    ("15-communities.md", 2349, 2554, "Communities"),
    ("16-core-mechanics.md", 2554, 3010, "Core Mechanics"),
    ("17-combat-damage.md", 3010, 3200, "Combat, Damage & Conditions"),
    ("18-downtime-death-leveling.md", 3200, 3360, "Downtime, Death & Leveling Up"),
    ("19-equipment-weapons.md", 3361, 3900, "Equipment: Weapons"),
    ("20-equipment-wheelchair.md", 3900, 4002, "Equipment: Combat Wheelchair"),
    ("21-equipment-armor.md", 4003, 4095, "Equipment: Armor"),
    ("22-loot-consumables-gold.md", 4095, 4467, "Loot, Consumables & Gold"),
    ("23-gm-guidance.md", 4467, 4700, "GM Guidance & Core Mechanics"),
    ("24-gm-difficulty-benchmarks.md", 4700, 4912, "Difficulty Benchmarks & Adversary Actions"),
    ("25-gm-advanced.md", 4912, 5088, "Advanced GM Mechanics"),
    ("26-adversaries-overview.md", 5089, 5394, "Adversaries Overview & Encounter Building"),
    ("27-adversaries-tier1.md", 5395, 6363, "Adversaries: Tier 1"),
    ("28-adversaries-tier2.md", 6364, 7113, "Adversaries: Tier 2"),
    ("29-adversaries-tier3.md", 7114, 7647, "Adversaries: Tier 3"),
    ("30-adversaries-tier4.md", 7648, 8134, "Adversaries: Tier 4"),
    ("31-environments-overview.md", 8135, 8218, "Environments Overview"),
    ("32-environments-tier1.md", 8219, 8498, "Environments: Tier 1"),
    ("33-environments-tier2.md", 8499, 8679, "Environments: Tier 2"),
    ("34-environments-tier3.md", 8680, 8817, "Environments: Tier 3"),
    ("35-environments-tier4.md", 8818, 9014, "Environments: Tier 4"),
    ("36-additional-gm-guidance.md", 9015, 9141, "Additional GM Guidance"),
    ("37-witherwild-campaign.md", 9142, 9696, "The Witherwild Campaign Frame"),
    ("38-domain-cards-arcana.md", 9697, 9906, "Domain Cards: Arcana"),
    ("39-domain-cards-blade.md", 9907, 10035, "Domain Cards: Blade"),
    ("40-domain-cards-bone.md", 10036, 10197, "Domain Cards: Bone"),
    ("41-domain-cards-codex.md", 10198, 10448, "Domain Cards: Codex"),
    ("42-domain-cards-grace.md", 10449, 10632, "Domain Cards: Grace"),
    ("43-domain-cards-midnight.md", 10633, 10829, "Domain Cards: Midnight"),
    ("44-domain-cards-sage.md", 10830, 11069, "Domain Cards: Sage"),
    ("45-domain-cards-splendor.md", 11070, 11249, "Domain Cards: Splendor"),
    ("46-domain-cards-valor.md", 11250, 11394, "Domain Cards: Valor"),
]


def clean_for_markdown(text: str) -> str:
    """Light formatting pass to improve readability as markdown."""
    # Remove page separators
    text = re.sub(r"\n*={60}\nPAGE \d+\n={60}\n*", "\n\n", text)
    # Remove TOC dot leaders
    text = re.sub(r" ?\.( ?\.){3,}\.? ?\d*", "", text)
    # Remove page number footers like "3 2 Daggerheart SRD Daggerheart SRD"
    text = re.sub(r"\n\d+ \d+ Daggerheart SRD Daggerheart SRD\n", "\n", text)
    text = re.sub(r"\nDaggerheart SRD \d+\n", "\n", text)
    text = re.sub(r"\n\d+ Daggerheart SRD\n", "\n", text)
    # Collapse excessive blank lines
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def build_index(sections: list[tuple]) -> str:
    """Generate the index file content."""
    lines = [
        "# Daggerheart SRD — Agent Reference Index",
        "",
        "This documentation is split from the Daggerheart System Reference Document (SRD) 1.0.",
        "Use the links below to navigate to specific topics.",
        "",
        "## Quick Reference",
        "",
        "| Topic | File |",
        "|-------|------|",
    ]
    for filename, start, end, title in sections:
        if start is None:
            continue
        lines.append(f"| {title} | [{filename}]({filename}) |")

    lines.extend([
        "",
        "## Section Summaries",
        "",
        "### Rules & Character Building",
        "- **01-introduction.md** — What Daggerheart is, the Golden Rule, Rulings over Rules",
        "- **02-character-creation.md** — Steps 1-9 for building a PC (class, heritage, traits, equipment, background, experiences, domains, connections)",
        "- **03-domains-overview.md** — The 9 domains (Arcana, Blade, Bone, Codex, Grace, Midnight, Sage, Splendor, Valor) and which classes access them",
        "",
        "### Classes",
        "- **04 through 13** — Each of the 9 classes: Bard, Druid, Guardian, Ranger, Rogue, Seraph, Sorcerer, Warrior, Wizard",
        "- **06-classes-druid-beastforms.md** — All Druid Beastform stat blocks (Tiers 1-4)",
        "- **08-classes-ranger.md** — Includes Ranger Companion creation & rules",
        "",
        "### Heritage",
        "- **14-ancestries.md** — 18 ancestries + Mixed Ancestry rules",
        "- **15-communities.md** — 9 communities",
        "",
        "### Core Mechanics",
        "- **16-core-mechanics.md** — Action rolls, Hope/Fear, spotlight, turn order, special rolls, advantage/disadvantage",
        "- **17-combat-damage.md** — Evasion, HP, damage thresholds, attack rolls, damage types, range, movement, conditions",
        "- **18-downtime-death-leveling.md** — Rest moves, death moves, leveling up, multiclassing",
        "",
        "### Equipment",
        "- **19-equipment-weapons.md** — All weapon tables (Tiers 1-4, primary & secondary)",
        "- **20-equipment-wheelchair.md** — Combat Wheelchair rules & models",
        "- **21-equipment-armor.md** — All armor tables (Tiers 1-4)",
        "- **22-loot-consumables-gold.md** — Loot tables, consumable tables, gold system",
        "",
        "### Game Master",
        "- **23-gm-guidance.md** — GM principles, practices, pitfalls, core mechanics, making moves",
        "- **24-gm-difficulty-benchmarks.md** — Difficulty tables for all 6 traits, adversary action rolls",
        "- **25-gm-advanced.md** — Countdowns, NPCs, optional mechanics (fate rolls, underwater, PC conflict)",
        "- **36-additional-gm-guidance.md** — Story beats, session rewards, phased battles, downtime, campaign frames",
        "",
        "### Adversaries",
        "- **26-adversaries-overview.md** — Stat block anatomy, adversary types, encounter building (Battle Points)",
        "- **27 through 30** — Full stat blocks: Tier 1 (45 adversaries), Tier 2 (28+), Tier 3 (22), Tier 4 (18)",
        "",
        "### Environments",
        "- **31-environments-overview.md** — Environment stat block anatomy and usage",
        "- **32 through 35** — Full environment stat blocks by tier",
        "",
        "### Campaign & Domain Cards",
        "- **37-witherwild-campaign.md** — The Witherwild campaign frame (setting, mechanics, corruption)",
        "- **38 through 46** — Complete domain card references for all 9 domains",
    ])
    return "\n".join(lines) + "\n"


def main():
    with open(INPUT_PATH) as f:
        all_lines = f.readlines()

    os.makedirs(DOCS_DIR, exist_ok=True)
    print(f"Total lines in source: {len(all_lines)}")

    for filename, start, end, title in SECTIONS:
        path = os.path.join(DOCS_DIR, filename)

        if start is None:
            # Index file
            content = build_index(SECTIONS)
        else:
            # Extract line range (1-indexed, inclusive)
            raw = "".join(all_lines[start - 1 : end])
            cleaned = clean_for_markdown(raw)
            content = f"# {title}\n\n{cleaned}\n"

        with open(path, "w") as f:
            f.write(content)
        print(f"  Wrote {path} ({len(content):,} chars)")

    print(f"\nDone! {len(SECTIONS)} files written to {DOCS_DIR}/")


if __name__ == "__main__":
    main()
