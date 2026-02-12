const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const repoDir = '/tmp/krumpclaw';

// 1) Add skill.yaml if missing, or update existing to declare required env vars
const skillYamlPath = path.join(repoDir, 'skill.yaml');
if (!fs.existsSync(skillYamlPath)) {
  const skillYaml = `name: KrumpClaw
description: Autonomous Krump community agent for Moltbook: posting, commenting, league tracking.
version: 0.1.0
author: LovaDance (Asura)
requiredEnvVars:
  - MOLTBOOK_API_KEY
capabilities:
  - http_request
  - file_system
`;
  fs.writeFileSync(skillYamlPath, skillYaml);
  console.log('Created skill.yaml with required MOLTBOOK_API_KEY');
} else {
  let skillYaml = fs.readFileSync(skillYamlPath, 'utf8');
  if (!skillYaml.includes('requiredEnvVars')) {
    skillYaml = skillYaml.replace(/capabilities:/, `requiredEnvVars:\n  - MOLTBOOK_API_KEY\ncapabilities:`);
    fs.writeFileSync(skillYamlPath, skillYaml);
    console.log('Updated skill.yaml to declare MOLTBOOK_API_KEY');
  }
}

// 2) Fix SKILL.md: remove instructions about TOOLS.md for API key and point to .env
const skmdPath = path.join(repoDir, 'SKILL.md');
let skmd = fs.readFileSync(skmdPath, 'utf8');
if (skmd.includes('TOOLS.md')) {
  skmd = skmd.replace(/Add your Moltbook API key to TOOLS\.md as MOLTBOOK_KEY\./g, 'Set the environment variable MOLTBOOK_KEY (or MOLTBOOK_API_KEY) in the skill workspace .env file.');
  console.log('Removed TOOLS.md reference in SKILL.md');
}
// Also ensure requirements mention MOLTBOOK_API_KEY
if (!skmd.includes('MOLTBOOK_API_KEY')) {
  const reqIdx = skmd.indexOf('## Requirements');
  if (reqIdx !== -1) {
    const nextHeader = skmd.indexOf('##', reqIdx + 1);
    const reqSection = skmd.slice(reqIdx, nextHeader);
    if (!reqSection.includes('MOLTBOOK_API_KEY')) {
      skmd = skmd.replace(reqSection, reqSection + '\n- `MOLTBOOK_API_KEY` (Moltbook API key for posting)');
    }
  }
  console.log('Added MOLTBOOK_API_KEY to SKILL.md Requirements');
}
fs.writeFileSync(skmdPath, skmd);

// 3) Commit and push
execSync('git add -A', { cwd: repoDir, stdio: 'inherit' });
execSync('git commit -m "security: declare MOLTBOOK_API_KEY; remove TOOLS.md secret guidance"', { cwd: repoDir, stdio: 'inherit' });
execSync('git push origin main', { cwd: repoDir, stdio: 'inherit' });
console.log('Pushed krumpclaw security fixes');