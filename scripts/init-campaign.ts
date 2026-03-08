#!/usr/bin/env npx ts-node
/**
 * CLI wrapper: initialize a new campaign directory.
 * Usage: npx ts-node scripts/init-campaign.ts '<campaign-name>' <num-pcs> [tier]
 */

import * as fs from "fs";
import * as path from "path";
import type { Tier } from "../src/types";
import {
  validateCampaignName,
  validateNumPCs,
  validateTier,
  buildCampaign,
  buildSessionTemplate,
  padSessionNumber,
} from "../src/campaign";

const name = process.argv[2];
const numPCs = parseInt(process.argv[3], 10);
const tier = (parseInt(process.argv[4], 10) || 1) as Tier;

const nameErr = validateCampaignName(name);
if (nameErr) { console.error(`Error: ${nameErr}`); process.exit(1); }

const pcErr = validateNumPCs(numPCs);
if (pcErr) { console.error(`Error: ${pcErr}`); process.exit(1); }

const tierErr = validateTier(tier);
if (tierErr) { console.error(`Error: ${tierErr}`); process.exit(1); }

const root = path.resolve(__dirname, "..", "campaigns", name);
if (fs.existsSync(root)) {
  console.error(`Error: campaign directory already exists at ${root}`);
  process.exit(1);
}

const date = new Date().toISOString();
const campaign = buildCampaign(name, numPCs, tier, date);

fs.mkdirSync(path.join(root, "pcs"), { recursive: true });
fs.mkdirSync(path.join(root, "sessions"), { recursive: true });
fs.writeFileSync(path.join(root, "campaign.json"), JSON.stringify(campaign, null, 2) + "\n");

const sessionNum = padSessionNumber(1);
const template = buildSessionTemplate(sessionNum, date.split("T")[0], []);
fs.writeFileSync(path.join(root, "sessions", `session-${sessionNum}.md`), template);

console.log(`✓ Campaign "${name}" initialized at campaigns/${name}/`);
