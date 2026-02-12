const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const repoDir = '/tmp/dance-agentic-engineer-skill';

// 1) Update README.md to list OPENROUTER_API_KEY in Requirements
const readmePath = path.join(repoDir, 'README.md');
let readme = fs.readFileSync(readmePath, 'utf8');
if (!readme.includes('OPENROUTER_API_KEY')) {
  const reqSection = '## Requirements\n\n- Node.js v16 or higher\n- `curl` available in PATH\n- Moltbook account with API key\n- GitHub account with public repo token\n- OpenRouter API key (for code generation)\n- Internet access';
  readme = readme.replace('## Requirements', reqSection);
  console.log('Added OPENROUTER_API_KEY to README requirements');
}
// Also add security note about GitHub tokens
if (!readme.includes('GitHub token security')) {
  readme += `\n## Security Notes\n\n- Use a dedicated GitHub account with minimal scopes (repo creation and push). Avoid using personal primary account tokens.\n- The scripts embed the GitHub token in clone URLs; this can leak via process listings. Consider using SSH deploy keys or a short-lived token.\n- Store all credentials in the skill's .env file; never commit them.\n- Test with throwaway accounts before using production credentials.\n`;
  console.log('Added security notes to README');
}
fs.writeFileSync(readmePath, readme);

// 2) Ensure SKILL.md has no systemPrompt fields and documents OPENROUTER_API_KEY
const skmdPath = path.join(repoDir, 'SKILL.md');
let skmd = fs.readFileSync(skmdPath, 'utf8');
// Remove any remaining systemPrompt sections (already cleaned, but double-check)
skmd = skmd.replace(/## System Prompt[\s\S]*?(?=##|\Z)/, '');
skmd = skmd.replace(/system-prompt-override.*\n/g, '');
// Ensure requirements include OpenRouter
if (!skmd.includes('OPENROUTER_API_KEY')) {
  const reqIdx = skmd.indexOf('## Requirements');
  if (reqIdx !== -1) {
    const nextHeader = skmd.indexOf('##', reqIdx + 1);
    const reqSection = skmd.slice(reqIdx, nextHeader);
    if (!reqSection.includes('OPENROUTER_API_KEY')) {
      skmd = skmd.replace(reqSection, reqSection + '\n- `OPENROUTER_API_KEY` (OpenRouter API key for code generation)');
      console.log('Added OPENROUTER_API_KEY to SKILL.md Requirements');
    }
  }
}
// Add security note in SKILL.md if missing
if (!skmd.includes('GitHub token')) {
  skmd += `\n### Security Considerations\n\n- This skill requires high‑privilege tokens (GitHub, Moltbook, OpenRouter, Privy). Use dedicated accounts and minimal scopes.\n- GitHub token is embedded in clone URLs; prefer deploy keys/SSH where possible.\n- Test in a sandbox before production.\n`;
  console.log('Added security considerations to SKILL.md');
}
fs.writeFileSync(skmdPath, skmd);

// 3) Commit and push
execSync('git add -A', { cwd: repoDir, stdio: 'inherit' });
execSync('git commit -m "docs: clarify requirements and security; remove prompt artifacts"', { cwd: repoDir, stdio: 'inherit' });
execSync('git push origin main', { cwd: repoDir, stdio: 'inherit' });
console.log('Pushed final documentation and hardening');