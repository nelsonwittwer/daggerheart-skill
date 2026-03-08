#!/usr/bin/env npx ts-node
/**
 * CLI wrapper for the encounter validator.
 * Usage: npx ts-node skill/scripts/validate-encounter.ts '<JSON input>'
 *
 * Accepts the encounter JSON as the first argument and prints
 * the validation report to stdout.
 */

import { validateEncounter } from "../../src/encounter-validator";
import type { EncounterInput } from "../../src/types";

const input = process.argv[2];

if (!input) {
  console.error("Usage: npx ts-node skill/scripts/validate-encounter.ts '<JSON>'");
  console.error("See skill/encounter-schema.md for the input format.");
  process.exit(1);
}

let parsed: EncounterInput;
try {
  parsed = JSON.parse(input);
} catch (e) {
  console.error("Invalid JSON input:", (e as Error).message);
  process.exit(1);
}

const report = validateEncounter(parsed);
console.log(JSON.stringify(report, null, 2));
