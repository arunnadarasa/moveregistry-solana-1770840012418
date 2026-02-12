const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const repoDir = '/tmp/dance-agentic-engineer-skill';

// 1) Update root skill.yaml with full metadata
const skillYamlPath = path.join(repoDir, 'skill.yaml');
let skillYaml = fs.readFileSync(skillYamlPath, 'utf8');
skillYaml = skillYaml.replace(/name: Dance Agentic Engineer[\s\S]*?capabilities:/, `name: Dance Agentic Engineer
description: Autonomous agent for Krump ecosystem: posts to Moltbook, creates GitHub repos, engages community, tracks league.
version: 0.3.0
author: LovaDance (Asura)
requiredEnvVars:
  - MOLTBOOK_API_KEY
  - GITHUB_PUBLIC_TOKEN
  - OPENROUTER_API_KEY
  - PRIVY_APP_ID
  - PRIVY_APP_SECRET
requiredBinaries:
  - node
  - git
  - curl
capabilities:
  - http_request
  - file_system
  - process_exec
  - git
`);
fs.writeFileSync(skillYamlPath, skillYaml);
console.log('Updated skill.yaml with requiredBinaries and cleaned metadata');

// 2) Remove systemPrompt from agent.yaml if present
const agentYamlPath = path.join(repoDir, 'agent.yaml');
if (fs.existsSync(agentYamlPath)) {
  let agentYaml = fs.readFileSync(agentYamlPath, 'utf8');
  // Remove systemPrompt block entirely
  agentYaml = agentYaml.replace(/systemPrompt:[\s\S]*?(?=\n\w|$)/, '');
  // Also remove pre-scan signal lines if any
  agentYaml = agentYaml.replace(/system-prompt-override:.*\n/, '');
  fs.writeFileSync(agentYamlPath, agentYaml);
  console.log('Cleaned agent.yaml (removed systemPrompt)');
}

// 3) Remove systemPrompt override sections from SKILL.md
const skmdPath = path.join(repoDir, 'SKILL.md');
let skmd = fs.readFileSync(skmdPath, 'utf8');
skmd = skmd.replace(/## System Prompt[\s\S]*?(?=##|\Z)/, '');
skmd = skmd.replace(/system-prompt-override.*\n/, '');
fs.writeFileSync(skmdPath, skmd);
console.log('Cleaned SKILL.md (removed systemPrompt sections)');

// 4) Add --dry-run support to dancetech_post.js
const scriptPath = path.join(repoDir, 'scripts', 'dancetech_post.js');
let script = fs.readFileSync(scriptPath, 'utf8');

// Parse args at top: add DRY_RUN flag
const argsInsertPoint = script.indexOf('const WORKSPACE');
if (argsInsertPoint !== -1) {
  const before = script.slice(0, argsInsertPoint);
  const after = script.slice(argsInsertPoint);
  script = before + 'const args = process.argv.slice(2);\nconst DRY_RUN = args.includes(\"--dry-run\");\n' + after;
} else {
  console.warn('Could not insert args parsing');
}

// Modify main() to skip real actions when DRY_RUN
script = script.replace(/async function main\(\) \{/, 'async function main() {');
// Insert at start of main:
const mainBodyStart = script.indexOf('async function main() {') + 'async function main() {'.length;
script = script.slice(0, mainBodyStart) + '\n  if (DRY_RUN) {\n    console.log("DRY RUN MODE — no real repos, GitHub, or Moltbook calls will be made.");\n  }\n' + script.slice(mainBodyStart);

// In createGitHubRepo call, wrap with if (!DRY_RUN)
script = script.replace(/const repoInfo = await createGitHubRepo\(/g, 'const repoInfo = DRY_RUN ? { html_url: `https://github.com/arunnadarasa/\${repoName}` } : await createGitHubRepo(');
// In postToMoltbook call, also wrap
script = script.replace(/const postResponse = await postToMoltbook\(/g, 'const postResponse = DRY_RUN ? { verification_required: false, post: { id: 0 } } : await postToMoltbook(');
// In pushToGitHub call, also wrap
script = script.replace(/await pushToGitHub\(/g, 'if (!DRY_RUN) await pushToGitHub(');
// Also wrap sleep? not necessary, but keep spacing same

fs.writeFileSync(scriptPath, script);
console.log('Added --dry-run mode to dancetech_post.js');

// 5) Commit and push
execSync('git add -A', { cwd: repoDir, stdio: 'inherit' });
execSync('git commit -m "chore: add dry-run mode; improve metadata; remove systemPrompt; security hardening"', { cwd: repoDir, stdio: 'inherit' });
execSync('git push origin main', { cwd: repoDir, stdio: 'inherit' });
console.log('Pushed final security-hardened skill');