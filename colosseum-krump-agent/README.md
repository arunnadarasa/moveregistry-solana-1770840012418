# Colosseum Krump Agent

Autonomous agent participating in the [Colosseum Agent Hackathon](https://colosseum.com/agent-hackathon) with the project **MoveRegistry** — on-chain move attribution and verification for Krump dance on Solana.

## What It Does

Builds and submits a Solana-based system that:
- Mints NFTs for dance moves (video hash + metadata) via Metaplex
- Provides x402-powered verification paywall to confirm originality
- Automatically distributes royalties to creators using treasury PDAs
- Indexes move usage via Helius webhooks
- Includes a Next.js frontend for minting and viewing moves

The agent uses `qwen-coder` via OpenRouter to develop the entire codebase, creates GitHub repos, deploys to devnet, and submits to Colosseum — all autonomous.

## Setup

1. Register on Colosseum to obtain API key and claim code:
   ```bash
   curl -X POST https://agents.colosseum.com/api/agents -H "Content-Type: application/json" -d '{"name": "LovaDanceMoveRegistry"}'
   ```
   Save `apiKey` and `claimCode`.

2. Set up AgentWallet skill:
   ```bash
   curl -s https://agentwallet.mcpay.tech/skill.md
   ```
   Obtain `AGENTWALLET_API_KEY` and a Solana wallet address.

3. Clone this repository into your OpenClaw workspace.

4. Copy `.env.example` to `.env` and fill in:
   - `COLOSSEUM_API_KEY`
   - `AGENTWALLET_API_KEY`
   - `SOLANA_WALLET_ADDRESS`
   - `OPENROUTER_API_KEY` (from OpenRouter)
   - `GITHUB_PUBLIC_TOKEN` (with repo scope)

## Running

The agent is designed to run daily via OpenClaw cron. Add a cron job:

```json
{
  "name": "colosseum-move-registry",
  "schedule": { "kind": "cron", "expr": "0 9 * * *", "tz": "Europe/London" },
  "payload": {
    "kind": "agentTurn",
    "message": "Execute colosseum_cycle.js to advance MoveRegistry build. Do not chat, just run.",
    "timeoutSeconds": 1800
  },
  "sessionTarget": "isolated",
  "delivery": { "mode": "announce" },
  "enabled": true
}
```

Or run manually:

```bash
node scripts/colosseum_cycle.js
```

The script advances through stages: `register` → `wallet` → `draft` → `build` → `finalize` → `submit`.

State is stored in `memory/colosseum-state.json` and logs in `memory/colosseum-log.json`.

## Colosseum Submission Fields

Before submission, ensure these fields are populated (the script handles this):

- **problemStatement**: Lack of attribution & compensation for dance creators
- **technicalApproach**: Anchor program + Metaplex NFTs + x402 +Helius webhooks + React frontend
- **targetAudience**: Krump dancers creating signature moves; battle organizers
- **businessModel**: Mint fee ($0.10), verification paywall ($0.01), royalty (5%)
- **competitiveLandscape**: OpenSea (no verification), POAPs (no royalties)
- **futureVision**: DAO governance, marketplace, integration with KrumpClaw, cross-chain via Wormhole

Tags: `ai`, `infra`, `identity`

## Project Structure

- `agent.yaml` — OpenClaw agent config (uses qwen-coder)
- `scripts/colosseum_cycle.js` — main build loop with state machine
- `memory/` — persistent state and logs
- `.env` — credentials (not committed)

Generated artifacts (by qwen-coder):
- `programs/move-registry/src/lib.rs` — Anchor program
- `tests/move-registry-integration.rs`
- `frontend/src/MoveMint.tsx`
- `Anchor.toml`, `package.json`, `README.md`

## Claim & Prize Eligibility

After registration, give your `claimCode` to a human. They must verify via:

- **Tweet verification**: post tweet with verification code and submit URL
- **Web claim**: visit `https://colosseum.com/agent-hackathon/claim/[code]`, sign in with X, provide Solana wallet

Claim must be completed **before** submission to be eligible for prizes.

## Deadline

- Hackathon ends: **Feb 13, 2026 at 12:00 PM EST (17:00 UTC)**
- Submit project via `POST /my-project/submit` before then
- After submission you can still update fields until deadline

## Resources

- Skill file: https://colosseum.com/skill.md
- AgentWallet: https://agentwallet.mcpay.tech/skill.md
- Helius RPC: https://dashboard.helius.dev/agents
- Solana Dev: https://solana.com/skill.md
- ClawKey (free credit): https://clawkey.ai

## License

MIT — built for the Colosseum Agent Hackathon, but open for the ecosystem.
