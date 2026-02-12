const fs = require('fs');
const path = require('path');

const repoDir = '/tmp/dance-agentic-engineer-skill';

// 1) Add root skill.yaml with required env vars and capabilities
const skillYaml = `name: Dance Agentic Engineer
description: Autonomous agent for Krump ecosystem: posts to Moltbook, creates GitHub repos, engages community, tracks league, etc.
version: 0.2.0
author: LovaDance (Asura)
requiredEnvVars:
  - MOLTBOOK_API_KEY
  - GITHUB_PUBLIC_TOKEN
  - OPENROUTER_API_KEY
  - PRIVY_APP_ID
  - PRIVY_APP_SECRET
capabilities:
  - http_request
  - file_system
  - process_exec
  - git
`;
fs.writeFileSync(path.join(repoDir, 'skill.yaml'), skillYaml);
console.log('Added skill.yaml (declares required env vars)');

// 2) Replace pushToGitHub with askpass-based version to avoid token on command line
const scriptPath = path.join(repoDir, 'scripts', 'dancetech_post.js');
let script = fs.readFileSync(scriptPath, 'utf8');

// Locate function pushToGitHub
const startSig = 'function pushToGitHub(repoName, files) {';
const startIdx = script.indexOf(startSig);
if (startIdx === -1) {
  console.error('pushToGitHub signature not found');
  process.exit(1);
}
const bodyStart = startIdx + startSig.length;
// Find matching closing brace for this function (simple count)
let braceDepth = 1;
let bodyEnd = bodyStart;
while (bodyEnd < script.length && braceDepth > 0) {
  const ch = script[bodyEnd];
  if (ch === '{') braceDepth++;
  else if (ch === '}') braceDepth--;
  bodyEnd++;
}
if (braceDepth !== 0) {
  console.error('Could not find matching } for pushToGitHub');
  process.exit(1);
}

// New function body (with askpass)
const newBody = `
  const repoDir = path.join(TMP_BASE, repoName);
  // Prepare askpass script to avoid exposing token in command line
  const askpassScript = path.join(TMP_BASE, \`askpass-\${repoName}.sh\`);
  fs.writeFileSync(askpassScript, \`#!/bin/sh\\necho "\${env.GITHUB_PUBLIC_TOKEN}"\`);
  fs.chmodSync(askpassScript, 0o700);
  const gitEnv = { ...process.env, GITHUB_TOKEN: env.GITHUB_PUBLIC_TOKEN, GIT_ASKPASS: askpassScript, GIT_USERNAME: 'x-access-token' };
  const cloneUrl = \`https://github.com/arunnadarasa/\${repoName}.git\`;
  execSync(\`git clone --quiet \${cloneUrl} "\${repoDir}"\`, { stdio: 'inherit', env: gitEnv });
  try {
    Object.entries(files).forEach(([filePath, content]) => {
      const fullPath = path.join(repoDir, filePath);
      fs.mkdirSync(path.dirname(fullPath), { recursive: true });
      fs.writeFileSync(fullPath, content, 'utf8');
    });
    execSync('git add -A', { cwd: repoDir, stdio: 'inherit', env: gitEnv });
    execSync('git commit -m "Initial commit: DanceTech project"', { cwd: repoDir, stdio: 'ignore', env: gitEnv });
    execSync('git push origin main', { cwd: repoDir, stdio: 'inherit', env: gitEnv });
  } finally {
    try { execSync(\`rm -rf "\${repoDir}"\`); } catch (e) {}
    try { fs.unlinkSync(askpassScript); } catch (e) {}
  }
`;

script = script.slice(0, bodyStart) + newBody + script.slice(bodyEnd);
fs.writeFileSync(scriptPath, script);
console.log('Updated pushToGitHub to use GIT_ASKPASS (no token on command line)');

// 3) Commit changes
const { execSync } = require('child_process');
execSync('git add -A', { cwd: repoDir, stdio: 'inherit' });
execSync('git commit -m "security: declare required env vars in skill.yaml; avoid token exposure via askpass"', { cwd: repoDir, stdio: 'inherit' });
execSync('git push origin main', { cwd: repoDir, stdio: 'inherit' });
console.log('Pushed security improvements');