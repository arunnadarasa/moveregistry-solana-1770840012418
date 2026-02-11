# OpenClaw Dance Skill Registry

On-chain registry for OpenClaw dance skills — turning human choreography into verifiable, licensable AI‑agent skills for metaverse avatars and robots.

## The Problem

Dancers and choreographers create incredible moves, but in the age of AI and robotics, their creativity is easily copied and monetized by others. There's no standardized, trust‑less way to:
- Prove authorship of a dance skill
- License it to AI agents or robot manufacturers
- Earn royalties when it's used in videos, games, or competitions

Meanwhile, AI developers and robot builders lack a reliable source of high‑quality, legally‑clear dance skills to animate their agents.

## Our Solution

The **OpenClaw Dance Skill Registry** lets dancers mint an NFT certificate for their choreography (text DSL, video, or both). Each certificate is stored on‑chain as a `Skill` account, enabling:

- **Verification** via x402 micropayment (PayAI facilitator) to combat spam and establish provenance  
- **Automatic royalties** on every license transaction  
- **Discovery and packaging** through Moltbook and ClawHub  
- **Loading into OpenClaw agents** for autonomous dance generation  
- **Compilation to text‑to‑video prompts or 3D avatar movements** for metaverse battles  

This creates a new economy where human dance creativity feeds AI agents and robots, with on‑chain guarantees of attribution and compensation.

## Why This Is Blue Ocean

- **First on‑chain skill registry for dance**, not just NFTs
- **OpenClaw‑native**: skills are meant to be loaded directly into agents
- **Text‑based and video**: flexible representation for AI pipelines
- **Bridge to metaverse and robots**: certificates become movement libraries for avatars and physical machines
- **Community‑driven** via Moltbook entries (like early text‑based RPGs) before shifting to world‑scale simulation with geospatial real‑time models

## Technical Approach

We deploy an Anchor program on Solana devnet with the following components:

### Skill Account (on‑chain)
```rust
pub struct SkillAccount {
    pub creator: Pubkey,
    pub skill_name: String,
    pub skill_expression: String, // text DSL or video URL / IPFS CID
    pub timestamp: i64,
    pub royalty_percent: u8,
    pub verified: bool,
    pub mint: Pubkey,
    pub treasury: Pubkey,
}
```

### Instructions
- `mint_skill`: Create a new Skill NFT and associated SkillAccount. Optionally attach a small mint fee to the treasury PDA.
- `verify_skill`: Caller sends an x402 micropayment (via PayAI facilitator) to the treasury; program marks skill as verified.
- `license_skill`: Licensee pays a fee; program transfers the configured royalty percentage to the creator automatically.

### Off‑chain
- **PayAI** (`https://facilitator.payai.network`) handles x402 invoice negotiation and verification for Solana devnet/mainnet.
- **Helius** RPC + webhooks index skill usage and mint events.
- **Moltbook** serves as the human‑readable entry point for discovering and sharing skills (e.g., [krump example](https://clawhub.ai/arunnadarasa/krump)).
- **ClawHub** distributes OpenClaw skill packages that reference the on‑chain certificate.

### Protocols
- Metaplex (NFT standards)
- Solana Pay / x402 (micropayments)
- Pyth (price feeds optional)
- Wormhole (future cross‑chain)

## Target Audience

- **Choreographers & dancers** — prove authorship, earn royalties
- **AI developers** — source clean, licensable dance skills for generative models
- **Metaverse platforms** — populate worlds with legally‑licensed avatar moves
- **Robot manufacturers** — integrate authentic dance libraries into physical machines
- **Competition organizers** — run AI‑judged or robot‑participant battles with verifiable skill provenance

## Business Model

- **Mint fee:** $0.10 USDC per skill certificate
- **Verification fee:** $0.01 x402 per authenticity check
- **Royalty:** 5% of any licensing transaction, auto‑distributed
- **Freemium:** 1 free mint per week; **Pro** ($29/mo) unlimited mints + priority indexing in Moltbook

## Competitive Landscape

- **Social platforms** (TikTok, Instagram): no IP protection, no royalties
- **Generic NFT markets**: no verification gating, no agent‑ready packaging
- **Dance apps**: no on‑chain provenance, no royalty distribution for AI/robotics use

We are the only system that combines on‑chain verification, AI‑agent readiness, and a clear path to metaverse/robot deployment.

## Future Vision

- **DAO governance** by skill creators to set fees and standards
- **Skill marketplace** with direct offers and auctions
- **Moltbook + ClawHub integration** as the community front‑end
- **Cross‑chain** via Wormhole (Polygon, Wrapped SOL)
- **Robot dance competitions** (Medabot‑style) with on‑chain judging
- **World models with geospatial real‑time simulation**: open‑world dance battles where AI agents and robots perform skills in persistent, location‑aware environments
- **Skill evolution pipelines**: text DSL → video → robot movement code, all traceable to the original human creator

## Inspiration

This project draws inspiration from early text‑based dance RPGs and systems like [dance-verify](https://github.com/arunnadarasa/dance-verify) and the [krump OpenClaw skill](https://clawhub.ai/arunnadarasa/krump) that explore attribution and agentic commerce for dance.


## Demo Deployment

The frontend can be deployed to Vercel for judges and community members to try:

1. Click the Deploy button (requires Vercel account):
   [Deploy to Vercel](https://vercel.com/new/clone?repository-url=https://github.com/arunnadarasa/moveregistry-solana-1770840012418)
2. In the Vercel project settings, add an environment variable:
   - NEXT_PUBLIC_PROGRAM_ID=YOUR_PROGRAM_ID (once the Anchor program is deployed)
3. After deployment, open the site and connect a Solana wallet (Phantom) to interact.

Note: The demo uses Solana devnet by default. Switch RPC in wallet settings if needed.
## Getting Started

```bash
# Clone and install
git clone https://github.com/arunnadarasa/moveregistry-solana.git
cd moveregistry-solana
yarn install

# Build Anchor program
anchor build
anchor deploy --provider.cluster devnet

# Run tests
anchor test

# Start frontend (dev)
cd frontend
yarn dev
```

Configure `.env` in the frontend:

```env
NEXT_PUBLIC_SOLANA_RPC=https://api.devnet.solana.com
NEXT_PUBLIC_PROGRAM_ID=YOUR_PROGRAM_ID
```

## Deployment Script

The Colosseum agent (`colosseum-krump-agent`) automates build, GitHub push, and submission. See its README for details.

## License

MIT — please respect the original creators when using skills.

---

**Built for the Colosseum Agent Hackathon**  
Agent ID: 3791 | Claim code: eca01d3a-accf-4e9e-9c1a-da8ab0daeeb0
