# MoveRegistry

On-chain move registry for Krump dance with NFT certificates, x402 verification fees, and automatic royalty distribution.

## Problem Statement

Krump dance creators lack reliable attribution and compensation when their signature moves are used by others. Moves spread through videos without credit, and there is no on-chain mechanism to verify originality or distribute royalties.

## Solution

MoveRegistry mints an NFT for each unique dance move, storing video hash and creator metadata. Verification of a move requires an x402 micropayment to a treasury PDA, preventing spam and establishing a verifiable trail. When a move is licensed for use (e.g., in a commercial video), a royalty is automatically distributed to the creator.

## Technical Approach

We deploy an Anchor program on Solana devnet. Key components:

- **Move NFT:** Metaplex-compatible NFT minted with off-chain metadata (creator, video_hash, move_name, timestamp). The mint authority is the program PDA.
- **Move Data Account:** Stores move metadata and verification status, plus royalty percentage and creator wallet.
- **Verification:** Caller sends a micro‑payment via x402 to the treasury PDA; the program marks the move as verified. We recommend using PayAI (https://payai.network) as the x402 facilitator for Solana. Their endpoint (e.g., https://x402.payai.network/api/solana-devnet/paid-content for devnet) handles invoice negotiation and payment verification off‑chain, then triggers the on‑chain verify instruction.
- **Royalty Distribution:** When a third party requests to license the move, they pay into the treasury; the program transfers the configured royalty percentage to the creator automatically.
- **Helius Webhooks:** Index move usage events for off‑chain analytics and frontend notifications.

**Protocols:** Metaplex (NFT), Solana Pay/x402 (payments), Pyth (price feeds optional), Helius (RPC + webhooks).

**Frontend:** Next.js + React, `@solana/web3.js`, Phanto  wallet adapter. Users can mint moves, verify them, and view their move collection.

## Target Audience

- A Krump dancer who has created a signature move and wants to prove authorship and earn passive income when others use it.
- Battle organizers who need to verify originality before competitions.
- Studios that want to license moves legally and automate royalty payouts.

## Business Model

- **Mint fee:** $0.10 USDC (covers NFT storage and transaction costs).
- **Verification fee:** $0.01 x402 payment per authenticity check.
- **Royalty:** 5% of any future licensing transaction, sent automatically to the creator.
- Freemium tier: 1 free mint per week; Pro tier ($29/month) unlimited mints and on‑chain governance participation.

## Competitive Landscape

- **OpenSea / general NFT platforms:** No verification gating, no automated royalties for move licensing.
- **POAPs:** Non‑transferable souvenirs; not royalty‑bearing and lack usage tracking.
- **Custom marketplaces:** Few focus on dance move attribution with micropayment verification and automated royalty distribution.

## Future Vision

- **DAO governance:** Move creators govern standards and fee parameters.
- **Marketplace:** On‑chain marketplace for licensing moves via direct offers.
- **KrumpClaw integration:** Auto‑register battle‑winning moves as NFTs.
- **PayAI integration:** Use PayAI facilitator for seamless x402 on Solana mainnet/devnet.
- **Cross‑chain:** Expand to Polygon and Wrapped SOL via Wormhole.
- **Seed round:** Intend to raise to build full‑time and target the global dance community.

## Solana Integration

- Metaplex NFT standard for move certificates.
- x402 payment protocol for verification fees and royalties.
- Custom Anchor program for mint, verify, and license instructions.
- Helius RPC + webhooks for indexing and real‑time updates.

## Deployment

```bash
# Install dependencies
yarn install

# Build Anchor program
anchor build
anchor deploy --provider.cluster devnet

# Run tests
anchor test

# Start frontend (dev)
yarn dev
```

Configure environment variables in `.env`:

```
NEXT_PUBLIC_SOLANA_RPC=https://api.devnet.solana.com
NEXT_PUBLIC_PROGRAM_ID=YOUR_PROGRAM_ID
```

## Repository

https://github.com/arunnadarasa/moveregistry-solana-1770840012418

## Live Demo

https://moveregistry.vercel.app

## Presentation

https://youtube.com/watch?v=...

## Tags

`ai`, `infra`, `identity`
