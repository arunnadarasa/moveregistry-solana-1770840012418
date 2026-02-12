const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const repoDir = '/tmp/dance-agentic-engineer-skill';

// Add Security Considerations to SKILL.md if missing
const skmdPath = path.join(repoDir, 'SKILL.md');
let skmd = fs.readFileSync(skmdPath, 'utf8');
if (!skmd.includes('Security Considerations')) {
  skmd += `\n## Security Considerations\n\n- This skill requires a GitHub token with \`public_repo\` scope. Use a dedicated account and token, not your primary account.\n- The token is passed to git via a temporary askpass script to avoid exposing it in process listings.\n- Moltbook API key and OpenRouter API key are also required; treat them as secrets.\n- The skill creates many GitHub repos and posts frequently; test with a throwaway Moltbook account and GitHub account before using production accounts.\n`;
  fs.writeFileSync(skmdPath, skmd);
  console.log('Added Security Considerations to SKILL.md');
}

// Commit and push
execSync('git add -A', { cwd: repoDir, stdio: 'inherit' });
execSync('git commit -m "docs: add security considerations; minor fixes"', { cwd: repoDir, stdio: 'inherit' });
execSync('git push origin main', { cwd: repoDir, stdio: 'inherit' });
console.log('Pushed final updates');
