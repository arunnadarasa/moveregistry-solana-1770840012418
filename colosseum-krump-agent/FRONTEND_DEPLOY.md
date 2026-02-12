# MoveRegistry Frontend Deployment Guide

## 🚀 Quick Deploy to Vercel

1. Click this button (or go to vercel.com/new):
   - Import repository: `https://github.com/arunnadarasa/moveregistry-solana-1770840012418`
2. **Root Directory**: Set to `colosseum-krump-agent/frontend`
3. **Environment Variables** (required):
   - `NEXT_PUBLIC_PRIVY_APP_ID`: Your Privy app ID (get from privy.io)
   - `NEXT_PUBLIC_SOLANA_RPC`: `https://api.devnet.solana.com`
   - `NEXT_PUBLIC_PROGRAM_ID`: Your deployed Anchor program ID (from `anchor keys list`)
   - `NEXT_PUBLIC_URL`: Your Vercel URL (e.g., `https://moveregistry-solana.vercel.app`)
4. Click **Deploy**

## 🔧 Setup Before Deploy

### 1. Get Privy App ID
- Sign up at https://privy.io
- Create a new app
- Set redirect URLs to your Vercel domain
- Copy the App ID into `NEXT_PUBLIC_PRIVY_APP_ID`

### 2. Deploy Anchor Program to Solana Devnet
```bash
cd programs/move-registry
anchor build
anchor deploy --provider.cluster devnet
# Copy the program ID from output

# Fund the deployer wallet with devnet SOL
solana airdrop 2

# Save program ID to frontend env
echo "NEXT_PUBLIC_PROGRAM_ID=YOUR_PROGRAM_ID" > frontend/.env.local
```

### 3. x402 Integration (Optional for Demo)
- If you have PayAI test points, configure your x402 service endpoint
- Set `NEXT_PUBLIC_X402_ENDPOINT` in Vercel env
- The `verify-x402` API route will forward payment requests

## 📹 Colosseum Video Recording

**Record 2-3 minutes showing:**

1. **Live site** on Vercel
2. **Connect wallet** using Privy (shows real wallet flow)
3. **Fill form**: move name, video hash (use any string), royalty slider
4. **Click "Mint Move NFT (Devnet)"** — show transaction signing, success message with Solscan link
5. **Show x402 button** and explain verification flow
6. **Explain code**: Anchor program structure, Metaplex metadata, treasury PDA

**Talk track:**
- Problem: Dance moves used without credit
- Solution: On-chain NFT + x402 verification + automatic royalties
- Tech: Solana + Anchor + Metaplex + Privy + x402
- Vision: DAO, KrumpClaw integration, marketplace

## 📝 Colosseum Forum Post

Short template:

> **MoveRegistry** — On-chain dance move attribution on Solana
>
> Live demo: [Your Vercel URL]
> GitHub: https://github.com/arunnadarasa/moveregistry-solana-1770840012418
>
> Features:
> - Mint dance moves as NFTs with Anchor program
> - Real wallet connection via Privy
> - x402 verification for authenticity (PayAI test points)
> - Automatic royalty distribution to treasury PDA
>
> Built for Colosseum Agent Hackathon by Asura (RyuAsura Dojo)
> Vote MoveRegistry!

## ⚠️ Notes

- **Security**: Never commit `.env` files. Use Vercel environment variables only.
- **Devnet SOL**: Your wallet needs devnet SOL for transactions. Request airdrops: https://faucet.solana.com
- **Program ID**: Must match the deployed program. Update `.env` if you redeploy.
- **x402**: The demo uses a simulated endpoint. For production, integrate with PayAI or similar.

## 🎯 Submission Checklist

- [ ] Vercel deployment live
- [ ] Privy app configured and working
- [ ] Anchor program deployed to devnet
- [ ] Video recorded (under 3 min)
- [ ] Colosseum fields updated:
  - `liveAppLink`: Vercel URL
  - `presentationLink`: YouTube video
- [ ] Forum post made
- [ ] Human claim completed (use claim code before Feb 13)

## 🤝 Support

- Issues: https://github.com/arunnadarasa/moveregistry-solana-1770840012418/issues
- Questions: Post on Colosseum forum

---

Built with ❤️ for the dance community. Kindness over everything.