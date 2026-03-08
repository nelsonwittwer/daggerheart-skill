#!/usr/bin/env npx ts-node
/**
 * CLI wrapper: create a PC JSON file for a campaign.
 * Usage: npx ts-node scripts/create-pc.ts '<campaign-name>' '<PC JSON>'
 */

import * as fs from "fs";
import * as path from "path";
import type { Campaign, PlayerCharacter } from "../src/types";
import { validatePC, slugify, addPCToCampaign } from "../src/campaign";

const campaignName = process.argv[2];
const pcJson = process.argv[3];

if (!campaignName || !pcJson) {
  console.error("Usage: npx ts-node scripts/create-pc.ts '<campaign-name>' '<PC JSON>'");
  process.exit(1);
}

const campaignDir = path.resolve(process.cwd(), "campaigns", campaignName);
const campaignFile = path.join(campaignDir, "campaign.json");

if (!fs.existsSync(campaignFile)) {
  console.error(`Error: campaign "${campaignName}" not found. Run init-campaign first.`);
  process.exit(1);
}

let pc: PlayerCharacter;
try { pc = JSON.parse(pcJson); } catch (e) {
  console.error("Invalid JSON:", (e as Error).message);
  process.exit(1);
}

const missing = validatePC(pc);
if (missing.length > 0) {
  console.error(`Error: PC JSON missing required fields: ${missing.join(", ")}`);
  process.exit(1);
}

const slug = slugify(pc.name);
const pcFile = path.join(campaignDir, "pcs", `${slug}.json`);

if (fs.existsSync(pcFile)) {
  console.error(`Error: PC file already exists: ${pcFile}`);
  process.exit(1);
}

fs.writeFileSync(pcFile, JSON.stringify(pc, null, 2) + "\n");

const campaign: Campaign = JSON.parse(fs.readFileSync(campaignFile, "utf-8"));
const updated = addPCToCampaign(campaign, slug);
fs.writeFileSync(campaignFile, JSON.stringify(updated, null, 2) + "\n");

console.log(`✓ PC "${pc.name}" created at campaigns/${campaignName}/pcs/${slug}.json`);
console.log(`  Class: ${pc.class} (${pc.subclass})`);
console.log(`  Heritage: ${pc.ancestry} / ${pc.community}`);
console.log(`  Level ${pc.level} | HP ${pc.hpMax} | Evasion ${pc.evasion}`);
