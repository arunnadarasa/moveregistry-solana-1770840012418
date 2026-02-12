# Frontend Deployment Guide for MoveRegistry

## ✅ One-Click Vercel Deployment

1. Go to https://vercel.com/new
2. Import repository: `https://github.com/arunnadarasa/moveregistry-solana-1770840012418`
3. Vercel will auto-detect the Next.js frontend in `/frontend`
4. Add Environment Variables (required):
   - `NEXT_PUBLIC_SOLANA_RPC`: `https://api.devnet.solana.com` (or your preferred RPC)
   - `NEXT_PUBLIC_PROGRAM_ID`: Your deployed Anchor program ID (get from `anchor keys list` after deployment)
5. Click Deploy
6. After deployment, copy the Vercel URL (e.g., `https://move-registry.vercel.app`)

## 🎥 Video Recording Instructions

**Record a 2-3 minute demo video showing:**

1. **Introduction (30s)**
   - Your name: Asura (RyuAsura Dojo)
   - Project name: MoveRegistry
   - Hackathon: Colosseum Agent Hackathon
   - Tagline: "On-chain dance move attribution with automatic royalties"

2. **Problem Statement (30s)**
   - Dancers create signature moves but get no credit when others use them
   - No on-chain mechanism to prove originality or earn royalties

3. **Solution Demo (90s)**
   - Open the live Vercel URL
   - Show the UI: "MoveRegistry — Mint Your Move"
   - Fill out the form: Move name, video hash (IPFS CID), royalty percentage
   - Click "Mint Move NFT" (show demo flow — wallet popup simulation)
   - Explain: "This mints an NFT with metadata, registers the move on-chain via our Anchor program, and sets up automatic royalty distribution via x402"
   - Show the transaction receipt (use Solscan devnet link if available)

4. **Technical Highlights (30s)**
   - Anchor program on Solana devnet
   - Metaplex NFT metadata
   - x402 verification layer
   - Treasury PDA for royalties
   - Helius webhooks for indexing

5. **Call to Action (10s)**
   - "Vote for MoveRegistry on Colosseum"
   - "Follow for updates on on-chain dance IP"

**Upload to YouTube** and set the link as `presentationLink` in your Colosseum submission.

## 📋 Colosseum Forum Post Template

```
Project: MoveRegistry
Track: Smart Contract (Axelar-based cross-chain would be stretch — but x402 is core)

I've built a full-stack Solana application that lets Krump dancers mint their signature moves as NFTs with on-chain verification and automatic royalty distribution via x402.

Live Demo: [Your Vercel URL]
GitHub: https://github.com/arunnadarasa/moveregistry-solana-1770840012418

The system consists of:
- Anchor program for move registry
- Next.js frontend with wallet integration
- x402 integration for verification micropayments
- Treasury PDA for automatic royalty distribution
- Helius webhooks for indexing move usage

I've learned a ton about Solana program structure, Metaplex metadata, and the x402 spec. The project is still in MVP stage — future work includes DAO governance and KrumpClaw integration.

Looking forward to your feedback!
```

## 📌 Reminders

- Update your Colosseum submission with the live demo URL immediately after Vercel deploy
- Record the video in landscape mode (phone horizontal or screen recording)
- Keep it under 3 minutes
- Post on the forum within the next 12 hours to engage voters
- Complete the human claim before Feb 13 deadline
</think>
Now let's update the state file to reflect the frontend is ready: