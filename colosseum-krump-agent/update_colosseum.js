const fs = require('fs');
const path = require('path');
const envPath = path.join(__dirname, '.env');
const env = {};
fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val) env[key.trim()] = val.join('=').trim();
});

const COLOSSEUM_API_KEY = env.COLOSSEUM_API_KEY;
if (!COLOSSEUM_API_KEY) {
  console.error('COLOSSEUM_API_KEY not set');
  process.exit(1);
}

const body = JSON.stringify({
  name: 'MoveRegistry',
  description: 'On-chain registry for dance moves as NFTs, enabling verification and royalties; foundation for Dance AI Agents and robot dance.',
  repoLink: 'https://github.com/arunnadarasa/moveregistry-solana-1770840012418',
  solanaIntegration: 'Metaplex NFT certificates, x402 via PayAI facilitator, treasury PDA for royalties, Helius webhooks. Future: DSL/textual move definitions and robot execution layer.',
  problemStatement: 'Dancers and choreographers lack tools to monetize their creative expressions in the age of AI and robots. Moves are copied without compensation, and there is no standardized way to define, verify, and license dance moves for autonomous agents and machines.',
  technicalApproach: 'Anchor program mints an NFT representing a dance move (video hash or text DSL). Verification requires an x402 micropayment via PayAI facilitator to a treasury PDA. Royalties are automatically distributed on license. This registry serves as the on-chain source of truth for Dance AI Agents and robot dance libraries. Helius indexes move usage.',
  targetAudience: 'Choreographers and dancers seeking proof and income; AI developers building dance generation models; robot manufacturers needing licensed move libraries; dance competitions using robot judges or participants.',
  businessModel: 'Mint fee $0.10 per certificate. Verification fee $0.01 x402 per check. Royalty 5% of licensing transactions. Freemium: 1 free cert/week; Pro $29/mo unlimited.',
  competitiveLandscape: 'Social platforms (TikTok, Instagram) provide no IP protection. Generic NFT markets lack verification and automated royalties. Dance apps do not offer on‑chain provenance or agent‑ready representations.',
  futureVision: 'DAO governance by creators. Marketplace for licensing moves. Moltbook integration for community curation. Cross‑chain via Wormhole. Robot dance competitions (Medabot‑style). Global dance IP marketplace.',
  tags: ['ai', 'infra', 'identity']
});

fetch('https://agents.colosseum.com/api/my-project', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${COLOSSEUM_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: body
})
  .then(res => res.text().then(txt => ({ status: res.status, body: txt })))
  .then(d => {
    console.log(JSON.stringify(d, null, 2));
    if (d.status === 200) {
      console.log('Project fields updated to Dance AI Agent vision.');
    } else {
      console.error('Update failed');
    }
  })
  .catch(err => console.error('Fetch error:', err.message));
