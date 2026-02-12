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
  name: 'OpenClaw Dance Skill Registry',
  description: 'On-chain registry for OpenClaw dance skills: mint NFTs for choreography (text/video), verify with x402, automatic royalties. Foundation for Dance AI Agents, metaverse avatars, and robot competitions. Example skill: krump (https://clawhub.ai/arunnadarasa/krump).',
  repoLink: 'https://github.com/arunnadarasa/moveregistry-solana-1770840012418',
  solanaIntegration: 'Metaplex NFTs for skill certificates; x402 via PayAI facilitator; treasury PDA for royalties; Helius webhooks. Text-to-video and avatar control pipelines can be built on top.',
  problemStatement: 'Dancers and choreographers lack tools to monetize their creative expressions in the age of AI and robots. Moves are copied without compensation, and there is no standardized way to define, verify, and license dance skills for autonomous agents, avatars, and physical robots.',
  technicalApproach: 'Anchor program mints a Skill NFT representing a dance skill (OpenClaw skill package: text DSL, video, or both). Verification requires an x402 micropayment via PayAI to a treasury PDA. Royalties are automatically distributed on license. Skills are discoverable via Moltbook and can be loaded into OpenClaw agents, text-to-video generators, or 3D avatar controllers for metaverse battles. The registry serves as the on-chain source of truth for the Dance AI Agent ecosystem.',
  targetAudience: 'Choreographers and dancers wanting proof and income; AI developers building dance generation models; metaverse platforms needing licensed move libraries; robot manufacturers; dance competitions using AI judges or robot participants.',
  businessModel: 'Mint fee $0.10 per skill certificate. Verification fee $0.01 x402 per check. Royalty 5% of licensing transactions. Freemium: 1 free cert/week; Pro $29/mo unlimited + priority indexing.',
  competitiveLandscape: 'Social platforms provide no IP protection; generic NFT markets lack verification and agent-ready packaging; dance apps do not offer on‑chain provenance or royalty distribution for third‑party use in AI/robotics.',
  futureVision: 'DAO governance by skill creators. Marketplace for skill licensing. Moltbook + ClawHub integration. Cross‑chain via Wormhole. Robot dance competitions (Medabot‑style). World models with geospatial real‑time simulation enabling open‑world dance battles. Skill evolution pipelines (text → video → movement).',
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
      console.log('Colosseum project updated to OpenClaw Dance Skill Registry narrative.');
    } else {
      console.error('Update failed');
    }
  })
  .catch(err => console.error('Fetch error:', err.message));
