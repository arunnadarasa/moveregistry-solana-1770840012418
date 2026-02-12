require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Validate required environment variables
const COLOSSEUM_API_KEY = process.env.COLOSSEUM_API_KEY;
if (!COLOSSEUM_API_KEY) {
  console.error('❌ COLOSSEUM_API_KEY is not set in .env file');
  process.exit(1);
}

// Configuration
const COLOSSEUM_API_URL = 'https://agents.colosseum.com/api/my-project';
const REPO_URL = 'https://github.com/arunnadarasa/moveregistry-solana-1770840012418';

// Project data following Colosseum submission requirements
const projectData = {
  name: 'MoveRegistry',
  description: 'On-chain registry for dance moves as NFTs, enabling verification and royalties; foundation for Dance AI Agents and robot dance.',
  repoLink: REPO_URL,
  solanaIntegration: 'Metaplex NFT certificates, x402 via PayAI facilitator, treasury PDA for royalties, Helius webhooks. Future: DSL/textual move definitions and robot execution layer.',
  problemStatement: 'Dancers and choreographers lack tools to monetize their creative expressions in the age of AI and robots. Moves are copied without compensation, and there is no standardized way to define, verify, and license dance moves for autonomous agents and machines.',
  technicalApproach: 'Anchor program mints an NFT representing a dance move (video hash or text DSL). Verification requires an x402 micropayment via PayAI facilitator to a treasury PDA. Royalties are automatically distributed on license. This registry serves as the on-chain source of truth for Dance AI Agents and robot dance libraries. Helius indexes move usage.',
  targetAudience: 'Choreographers and dancers seeking proof and income; AI developers building dance generation models; robot manufacturers needing licensed move libraries; dance competitions using robot judges or participants.',
  businessModel: 'Mint fee $0.10 per certificate. Verification fee $0.01 x402 per check. Royalty 5% of licensing transactions. Freemium: 1 free cert/week; Pro $29/mo unlimited.',
  competitiveLandscape: 'Social platforms (TikTok, Instagram) provide no IP protection. Generic NFT markets lack verification and automated royalties. Dance apps do not offer on‑chain provenance or agent‑ready representations.',
  futureVision: 'DAO governance by creators. Marketplace for licensing moves. Moltbook integration for community curation. Cross‑chain via Wormhole. Robot dance competitions (Medabot‑style). Global dance IP marketplace.',
  tags: ['ai', 'infra', 'identity']
};

/**
 * Makes an API request with retry logic
 */
async function makeRequest(url, options, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      const text = await response.text();
      return { status: response.status, body: text, ok: response.ok };
    } catch (error) {
      if (i === retries - 1) throw error;
      console.warn(`⚠️ Retry ${i + 1}/${retries} after error: ${error.message}`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}

/**
 * Main function to update Colosseum project
 */
async function main() {
  try {
    console.log('🔄 Updating Colosseum project fields...');

    const result = await makeRequest(COLOSSEUM_API_URL, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${COLOSSEUM_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(projectData)
    });

    console.log(JSON.stringify(result, null, 2));

    if (result.ok) {
      console.log('✅ Project fields updated successfully to Dance AI Agent vision.');
    } else {
      console.error('❌ Update failed with status:', result.status);
      console.error('Response:', result.body);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

main();