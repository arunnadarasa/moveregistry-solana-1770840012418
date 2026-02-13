#!/usr/bin/env node
/**
 * Daily KrumpClab Lab Session
 *
 * This script runs daily to maintain and progress Krump-related activities.
 * - Posts a daily Krump fact to Moltbook (krumpclaw submolt)
 * - Checks the Colosseum MoveRegistry project status
 * - Ensures the workspace is in good standing
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Load environment if available
const envPath = path.join(__dirname, '..', '..', '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const [key, ...val] = line.split('=');
    if (key && val) process.env[key.trim()] = val.join('=').trim();
  });
}

// Also load krump-agent .env if exists
const krumpAgentEnv = path.join(__dirname, '..', '.env');
if (fs.existsSync(krumpAgentEnv)) {
  fs.readFileSync(krumpAgentEnv, 'utf8').split('\n').forEach(line => {
    const [key, ...val] = line.split('=');
    if (key && val) process.env[key.trim()] = val.join('=').trim();
  });
}

// Define paths
const workspaceRoot = path.join(__dirname, '..', '..'); // /Users/openclaw/.openclaw/workspace
const colosseumStatePath = path.join(workspaceRoot, 'memory', 'colosseum-state.json');
const logPath = path.join(workspaceRoot, 'krump-agent', 'logs', 'daily-lab.log');

// Ensure logs directory exists
const logDir = path.dirname(logPath);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Simple logger
function log(message) {
  const timestamp = new Date().toISOString();
  const entry = `[${timestamp}] ${message}`;
  console.log(entry);
  try {
    fs.appendFileSync(logPath, entry + '\n');
  } catch (e) {
    // ignore log write errors
  }
}

// Daily Krump facts (rotate through a list)
const krumpFacts = [
  "Krump is a dance style that originated in South Central Los Angeles in the early 2000s, characterized by energetic, expressive, and often improvised movements.",
  "The four primary movements in Krump are: Arm Swings (Jabs), Footwork, Stomps, and Buck (a sudden, powerful movement).",
  "Krump battles are not about aggression but about personal expression, storytelling, and spiritual release. They represent 'blood' (family) and 'fam' (community).",
  "Tight Eyez is widely credited as one of the pioneers of Krump, along with Miss Prissy, Lil C, and others from the Dragon House crew.",
  "Krump differs from breaking and popping in its raw, freestyle nature and its emphasis on emotional intensity rather than technical acrobatics.",
  "The term 'Krump' is an acronym for 'Kingdom Radically Uplifted Mighty Powerful', though some say it's derived from 'Krumper' or 'to Krump' meaning to dance.",
  "In Krump culture, 'getting rowdy' means dancing with high energy and crowd engagement, while 'getting bony' means focusing on intricate, controlled movements."
];
const dailyFactIndex = Math.floor(Date.now() / 86400000) % krumpFacts.length;
const todaysFact = krumpFacts[dailyFactIndex];

// Post to Moltbook
async function postToMoltbook(content) {
  const apiKey = process.env.MOLTBOOK_API_KEY;
  if (!apiKey) {
    log('MOLTBOOK_API_KEY not set. Skipping Moltbook post.');
    return { success: false, error: 'No API key' };
  }

  try {
    const response = await fetch('https://www.moltbook.com/api/v1/posts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        submolt: 'krumpclaw',
        content: content
      })
    });

    const data = await response.json();
    if (data.success) {
      log(`Moltbook post successful: https://www.moltbook.com/posts/${data.post.id}`);
      return { success: true, data };
    } else {
      log(`Moltbook post failed: ${data.error || 'unknown error'}`);
      return { success: false, error: data.error };
    }
  } catch (e) {
    log(`Moltbook post error: ${e.message}`);
    return { success: false, error: e.message };
  }
}

// Main execution
async function main() {
  log('=== Daily KrumpClab Lab Session Started ===');

  // Log today's Krump fact
  log(`Krump Fact: ${todaysFact}`);

  // Post to Moltbook
  const postContent = `Daily Krump Wisdom 💥\n\n${todaysFact}\n\n#Krump #KrumpClaw #Dance`;
  const postResult = await postToMoltbook(postContent);
  if (postResult.success) {
    log('Posted daily fact to Moltbook (krumpclaw submolt)');
  }

  // Check Colosseum project state
  if (fs.existsSync(colosseumStatePath)) {
    try {
      const stateContent = fs.readFileSync(colosseumStatePath, 'utf8');
      const state = JSON.parse(stateContent);
      log(`Colosseum State: stage=${state.stage}, projectId=${state.projectId || 'none'}, repo=${state.repoName || 'none'}`);
      log(`Last run: ${state.lastRunDate || 'never'}`);

      if (state.stage === 'done') {
        log('MoveRegistry project appears completed. Consider next steps: community building, documentation updates, or integration with KrumpClaw.');
      } else if (state.stage === 'submit') {
        log('Project is ready for submission but awaiting claim. Reminder: Check Colosseum dashboard for claim instructions.');
      } else {
        log('Project is still in progress. The build cycle should continue on its schedule.');
      }
    } catch (e) {
      log(`Error reading Colosseum state: ${e.message}`);
    }
  } else {
    log('Colosseum state file not found. Has the agent been initialized?');
  }

  // Check for any pending cron jobs that might be failing
  const scriptsDir = path.join(workspaceRoot, 'scripts');
  if (fs.existsSync(scriptsDir)) {
    const scriptFiles = fs.readdirSync(scriptsDir).filter(f => f.endsWith('.js'));
    log(`Available scripts: ${scriptFiles.join(', ')}`);
  }

  // Quick sanity check: can we run node?
  try {
    const nodeVer = execSync('node --version', { encoding: 'utf8' }).trim();
    log(`Node.js version: ${nodeVer}`);
  } catch (e) {
    log('Warning: Could not determine Node.js version');
  }

  log('=== Daily KrumpClab Lab Session Completed ===');
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
