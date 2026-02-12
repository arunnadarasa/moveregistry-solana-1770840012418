const fs = require('fs');
const repoUrl = 'https://github.com/arunnadarasa/moveregistry-solana-1770840012418';
const demo = `
## Demo Deployment

The frontend can be deployed to Vercel for judges and community members to try:

1. Click the Deploy button (requires Vercel account):
   [Deploy to Vercel](https://vercel.com/new/clone?repository-url=${repoUrl})
2. In the Vercel project settings, add an environment variable:
   - NEXT_PUBLIC_PROGRAM_ID=YOUR_PROGRAM_ID (once the Anchor program is deployed)
3. After deployment, open the site and connect a Solana wallet (Phantom) to interact.

Note: The demo uses Solana devnet by default. Switch RPC in wallet settings if needed.
`;

const readmePath = `${__dirname}/moveregistry-dance-skill/README.md`;
let readme = fs.readFileSync(readmePath, 'utf8');
const gettingStarted = '## Getting Started';
const idx = readme.indexOf(gettingStarted);
if (idx !== -1) {
  readme = readme.slice(0, idx) + demo + readme.slice(idx);
} else {
  readme += demo;
}
fs.writeFileSync(readmePath, readme);
console.log('Added Demo Deployment section');
