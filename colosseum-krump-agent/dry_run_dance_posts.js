#!/usr/bin/env node
// Dry run: simulate 3 repo creations and Moltbook posts to submolt 'dance'

const crypto = require('crypto');

const TRACKS = {
  AgenticCommerce: { tag: 'AgenticCommerce', dirName: 'agentic-commerce' },
  OpenClawSkill: { tag: 'OpenClawSkill', dirName: 'openclaw-skill' },
  SmartContract: { tag: 'SmartContract', dirName: 'smart-contract' }
};

function randomSuffix() {
  return crypto.randomBytes(3).toString('hex').slice(0, 6);
}

function composePost(track, repoName, repoUrl) {
  if (track === 'AgenticCommerce') {
    return {
      title: `#DanceTech ProjectSubmission AgenticCommerce - ${repoName}`,
      content: `[DRY RUN] This would be a real post for ${repoName}. GitHub: ${repoUrl}`
    };
  } else if (track === 'OpenClawSkill') {
    return {
      title: `#DanceTech ProjectSubmission OpenClawSkill - ${repoName}`,
      content: `[DRY RUN] This would be a real post for ${repoName}. GitHub: ${repoUrl}`
    };
  } else if (track === 'SmartContract') {
    return {
      title: `#DanceTech ProjectSubmission SmartContract - ${repoName}`,
      content: `[DRY RUN] This would be a real post for ${repoName}. GitHub: ${repoUrl}`
    };
  }
}

async function main() {
  console.log('\n=== Dry Run: 3 Repo Creations + Moltbook Posts (submolt: dance) ===\n');

  for (const track of Object.keys(TRACKS)) {
    const suffix = randomSuffix();
    const repoName = `dry-run-${TRACKS[track].dirName}-${suffix}`;
    const description = `Dry run ${track} project`;
    const mockRepoUrl = `https://github.com/arunnadarasa/${repoName}`;

    console.log(`\n--- Track: ${track} ---`);
    console.log(`Would create GitHub repo: ${repoName}`);
    console.log(`Description: ${description}`);
    console.log(`Topics: dancetech, ${TRACKS[track].dirName}`);

    const { title, content } = composePost(track, repoName, mockRepoUrl);
    console.log(`\nWould post to Moltbook (submolt: dance):`);
    console.log(`  Title: ${title}`);
    console.log(`  Content preview: ${content.substring(0, 120)}...`);

    // Simulate delay between posts
    if (track !== Object.keys(TRACKS).pop()) {
      console.log('\n[Waiting 30s (simulated) before next post]');
      await new Promise(r => setTimeout(r, 30000));
    }
  }

  console.log('\n=== Dry Run complete. No real repos or posts were created. ===\n');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
