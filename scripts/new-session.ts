#!/usr/bin/env npx ts-node
/**
 * CLI wrapper: create a new session notes file for a campaign.
 * Usage: npx ts-node scripts/new-session.ts '<campaign-name>'
 */

import * as fs from "fs";
import * as path from "path";
import type { Campaign, PlayerCharacter } from "../src/types";
import {
  incrementSession,
  padSessionNumber,
  buildSessionTemplate,
} from "../src/campaign";

const campaignName = process.argv[2];

if (!campaignName) {
  console.error("Usage: npx ts-node scripts/new-session.ts '<campaign-name>'");
  process.exit(1);
}

const campaignDir = path.resolve(__dirname, "..", "campaigns", campaignName);
const campaignFile = path.join(campaignDir, "campaign.json");

if (!fs.existsSync(campaignFile)) {
  console.error(`Error: campaign "${campaignName}" not found.`);
  process.exit(1);
}

const campaign: Campaign = JSON.parse(fs.readFileSync(campaignFile, "utf-8"));
const updated = incrementSession(campaign);
const num = padSessionNumber(updated.sessionCount);

const pcNames: string[] = updated.pcs.map((slug) => {
  const pcFile = path.join(campaignDir, "pcs", `${slug}.json`);
  if (fs.existsSync(pcFile)) {
    const pc: PlayerCharacter = JSON.parse(fs.readFileSync(pcFile, "utf-8"));
    return pc.name;
  }
  return slug;
});

const template = buildSessionTemplate(num, new Date().toISOString().split("T")[0], pcNames);
fs.writeFileSync(path.join(campaignDir, "sessions", `session-${num}.md`), template);
fs.writeFileSync(campaignFile, JSON.stringify(updated, null, 2) + "\n");

console.log(`✓ Session ${num} created at campaigns/${campaignName}/sessions/session-${num}.md`);
