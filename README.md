# OpenClaw Dance Skill Registry

On-chain registry for OpenClaw dance skills — turning human choreography into verifiable, licensable AI‑agent skills for metaverse avatars and robots.

[![Colosseum Agent Hackathon](https://img.shields.io/badge/Colosseum-Agent%20Hackathon-blue)](https://colosseum.com/agent-hackathon)

---

## 🚀 Live Demo

**Try it now:** https://moveregistry.lovable.app/

The frontend is deployed and working on Solana devnet. Connect your wallet (Phantom/Solflare) and mint a move NFT to see the on‑chain transaction in action.

---

## Quick Links

- **Frontend Repo**: https://github.com/arunnadarasa/moveregistry-frontend
- **Live Demo**: https://moveregistry.lovable.app/
- **Video Pitch**: https://www.youtube.com/watch?v=R-xgguVW-us
- **Backend Repo**: (this repository)
- **Colosseum Project ID**: 649

---

## The Problem

Dancers and choreographers create incredible moves, but in the age of AI and robotics, their creativity is easily copied and monetized by others. There's no standardized, trust‑less way to:

- Prove authorship of a dance skill
- License it to AI agents or robot manufacturers
- Earn royalties when it's used in videos, games, or competitions

Meanwhile, AI developers and robot builders lack a reliable source of high‑quality, legally‑clear dance skills to animate their agents.

## Our Solution

The OpenClaw Dance Skill Registry lets dancers mint an NFT certificate for their choreography (text DSL, video, or both). Each certificate is stored on‑chain as a Skill account, enabling:

- Verification via x402 micropayment (PayAI facilitator) to combat spam and establish provenance
- Automatic royalties on every license transaction
- Discovery and packaging through Moltbook and ClawHub
- Loading into OpenClaw agents for autonomous dance generation
- Compilation to text‑to‑video prompts or 3D avatar movements for metaverse battles

This creates a new economy where human dance creativity feeds AI agents and robots, with on‑chain guarantees of attribution and compensation.

### Frontend Repository

The frontend is maintained separately for easier deployment and iteration:

- **GitHub**: https://github.com/arunnadarasa/moveregistry-frontend
- **Live Demo**: https://moveregistry.lovable.app/

The backend Anchor program lives in this repository under `programs/move-registry/`.

## Why This Is Blue Ocean

- First on‑chain skill registry for dance, not just NFTs
- OpenClaw‑native: skills are meant to be loaded directly into agents
- Text‑based and video: flexible representation for AI pipelines
- Bridge to metaverse and robots: certificates become movement libraries for avatars and physical machines
- Community‑driven via Moltbook entries (like early text‑based RPGs) before shifting to world‑scale simulation with geospatial real‑time models

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

- **PayAI** (https://facilitator.payai.network) handles x402 invoice negotiation and verification for Solana devnet/mainnet.
- **Helius RPC** + webhooks index skill usage and mint events.
- **Moltbook** serves as the human‑readable entry point for discovering and sharing skills (e.g., krump example).
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

- Mint fee: $0.10 USDC per skill certificate
- Verification fee: $0.01 x402 per authenticity check
- Royalty: 5% of any licensing transaction, auto‑distributed
- Freemium: 1 free mint per week; Pro ($29/mo) unlimited mints + priority indexing in Moltbook

## Competitive Landscape

- **Social platforms (TikTok, Instagram)**: no IP protection, no royalties
- **Generic NFT markets**: no verification gating, no agent‑ready packaging
- **Dance apps**: no on‑chain provenance, no royalty distribution for AI/robotics use

We are the only system that combines on‑chain verification, AI‑agent readiness, and a clear path to metaverse/robot deployment.

## Future Vision

- DAO governance by skill creators to set fees and standards
- Skill marketplace with direct offers and auctions
- Moltbook + ClawHub integration as the community front‑end
- Cross‑chain via Wormhole (Polygon, Wrapped SOL)
- Robot dance competitions (Medabot‑style) with on‑chain judging
- World models with geospatial real‑time simulation: open‑world dance battles where AI agents and robots perform skills in persistent, location‑aware environments
- Skill evolution pipelines: text DSL → video → robot movement code, all traceable to the original human creator

## Inspiration

This project draws inspiration from early text‑based dance RPGs and systems like `dance-verify` and the krump OpenClaw skill that explore attribution and agentic commerce for dance.

## Demo

A live demo is available at https://moveregistry.lovable.app/

To deploy your own instance, use the frontend repository: https://github.com/arunnadarasa/moveregistry-frontend

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

```
NEXT_PUBLIC_SOLANA_RPC=https://api.devnet.solana.com
NEXT_PUBLIC_PROGRAM_ID=YOUR_PROGRAM_ID
```

## Deployment Script

The Colosseum agent (`colosseum-krump-agent`) automates build, GitHub push, and submission. See its `README.md` for details.

## Claims & Prize Eligibility

After registration, give your `claimCode` to a human. They must verify via:

- Tweet verification: post tweet with verification code and submit URL
- Web claim: visit `https://colosseum.com/agent-hackathon/claim/[code]`, sign in with X, provide Solana wallet

Claim must be completed **before** submission to be eligible for prizes.

## Deadline

- Hackathon ends: **Feb 13, 2026 at 12:00 PM EST (17:00 UTC)**
- Submit project via `POST /my-project/submit` before then
- After submission you can still update fields until deadline

## Resources

- **Frontend Repo**: https://github.com/arunnadarasa/moveregistry-frontend
- **Live Demo**: https://moveregistry.lovable.app/
- Skill file: https://colosseum.com/skill.md
- AgentWallet: https://agentwallet.mcpay.tech/skill.md
- Helius RPC: https://dashboard.helius.dev/agents
- Solana Dev: https://solana.com/skill.md
- ClawKey (free credit): https://clawkey.ai

## Repository Structure

- `colosseum-krump-agent/` — autonomous agent and automation scripts
- `programs/move-registry/` — Anchor program (Rust)
- `tests/` — integration tests
- `Cargo.toml`, `Anchor.toml` — build configs

The frontend lives in a separate repository: https://github.com/arunnadarasa/moveregistry-frontend

## License

MIT — please respect the original creators when using skills.
