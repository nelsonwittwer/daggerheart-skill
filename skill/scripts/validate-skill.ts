#!/usr/bin/env npx ts-node
/**
 * Validate the SKILL.md file against Claude Code skill conventions.
 *
 * Checks:
 * - File exists and is non-empty
 * - Has valid YAML frontmatter with required fields (name, description)
 * - name is lowercase, hyphens only, max 64 chars
 * - Line count under 500 (recommended)
 * - Estimated token count (rough: chars / 4)
 * - No broken ${CLAUDE_PLUGIN_ROOT} references
 * - Supporting files referenced in SKILL.md exist
 */

import * as fs from "fs";
import * as path from "path";

const SKILL_DIR = path.resolve(__dirname, "..");
const SKILL_PATH = path.join(SKILL_DIR, "SKILL.md");
const REPO_ROOT = path.resolve(SKILL_DIR, "..");

interface Issue {
  level: "error" | "warning" | "info";
  message: string;
}

function validate(): Issue[] {
  const issues: Issue[] = [];

  // --- File exists ---
  if (!fs.existsSync(SKILL_PATH)) {
    issues.push({ level: "error", message: "SKILL.md not found at " + SKILL_PATH });
    return issues;
  }

  const content = fs.readFileSync(SKILL_PATH, "utf-8");
  const lines = content.split("\n");

  if (content.trim().length === 0) {
    issues.push({ level: "error", message: "SKILL.md is empty" });
    return issues;
  }

  // --- Frontmatter ---
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) {
    issues.push({ level: "error", message: "No YAML frontmatter found (must start with ---)" });
  } else {
    const fm = fmMatch[1];

    // name field
    const nameMatch = fm.match(/^name:\s*(.+)$/m);
    if (!nameMatch) {
      issues.push({ level: "error", message: "Frontmatter missing 'name' field" });
    } else {
      const name = nameMatch[1].trim();
      if (!/^[a-z0-9-]+$/.test(name)) {
        issues.push({ level: "error", message: `name "${name}" must be lowercase letters, numbers, and hyphens only` });
      }
      if (name.length > 64) {
        issues.push({ level: "error", message: `name "${name}" exceeds 64 character limit (${name.length})` });
      }
      issues.push({ level: "info", message: `Skill name: ${name}` });
    }

    // description field
    if (!fm.match(/^description:/m)) {
      issues.push({ level: "error", message: "Frontmatter missing 'description' field (needed for auto-invocation)" });
    }
  }

  // --- Line count ---
  issues.push({ level: "info", message: `Line count: ${lines.length}` });
  if (lines.length > 500) {
    issues.push({ level: "warning", message: `SKILL.md is ${lines.length} lines (recommended: under 500)` });
  }

  // --- Token estimate ---
  const charCount = content.length;
  const estimatedTokens = Math.ceil(charCount / 4);
  issues.push({ level: "info", message: `Character count: ${charCount.toLocaleString()}` });
  issues.push({ level: "info", message: `Estimated tokens: ~${estimatedTokens.toLocaleString()}` });

  if (estimatedTokens > 4000) {
    issues.push({ level: "warning", message: `High token count (~${estimatedTokens.toLocaleString()}). Consider moving detailed content to supporting files.` });
  }

  // --- Content after frontmatter ---
  const bodyStart = content.indexOf("---", 3);
  const body = bodyStart !== -1 ? content.slice(bodyStart + 3) : content;

  // Check for CLAUDE_PLUGIN_ROOT usage
  const pluginRootRefs = body.match(/\$\{CLAUDE_PLUGIN_ROOT\}/g) || [];
  issues.push({ level: "info", message: `\${CLAUDE_PLUGIN_ROOT} references: ${pluginRootRefs.length}` });

  // --- Check referenced files exist (relative to skill dir) ---
  const docRefs = body.match(/docs\/[a-z0-9-]+\.md/g) || [];
  const uniqueDocRefs = [...new Set(docRefs)];
  let missingDocs = 0;
  for (const ref of uniqueDocRefs) {
    const fullPath = path.join(SKILL_DIR, ref);
    if (!fs.existsSync(fullPath)) {
      issues.push({ level: "error", message: `Referenced file not found: ${ref}` });
      missingDocs++;
    }
  }
  issues.push({ level: "info", message: `Doc references: ${uniqueDocRefs.length} files (${missingDocs} missing)` });

  // Check supporting files referenced via ${CLAUDE_PLUGIN_ROOT}/
  const supportRefs = body.match(/\$\{CLAUDE_PLUGIN_ROOT\}\/([a-z0-9-/.]+)/g) || [];
  for (const ref of [...new Set(supportRefs)]) {
    const relPath = ref.replace("${CLAUDE_PLUGIN_ROOT}/", "");
    const fullPath = path.join(SKILL_DIR, relPath);
    if (!fs.existsSync(fullPath)) {
      issues.push({ level: "warning", message: `Referenced file not found: ${relPath}` });
    }
  }

  return issues;
}

// --- Run ---
const issues = validate();

const errors = issues.filter((i) => i.level === "error");
const warnings = issues.filter((i) => i.level === "warning");
const infos = issues.filter((i) => i.level === "info");

console.log("=== Daggerheart Skill Validation ===\n");

for (const i of infos) {
  console.log(`  [info] ${i.message}`);
}
console.log();

if (warnings.length > 0) {
  for (const i of warnings) {
    console.log(`  [warn] ${i.message}`);
  }
  console.log();
}

if (errors.length > 0) {
  for (const i of errors) {
    console.log(`  [ERROR] ${i.message}`);
  }
  console.log();
}

console.log(`Result: ${errors.length} error(s), ${warnings.length} warning(s)`);
if (errors.length > 0) {
  console.log("FAILED — fix errors before distributing.");
  process.exit(1);
} else if (warnings.length > 0) {
  console.log("PASSED with warnings.");
} else {
  console.log("PASSED");
}
