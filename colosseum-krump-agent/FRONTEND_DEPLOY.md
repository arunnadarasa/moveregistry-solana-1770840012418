# MoveRegistry Frontend — Deployment & Usage

The MoveRegistry frontend is a standalone Next.js application for minting and verifying dance move NFTs on Solana.

## Quick Links

- **GitHub Repository**: https://github.com/arunnadarasa/moveregistry-frontend
- **Live Demo**: https://moveregistry.lovable.app/

## Features

- Connect Solana wallet via Privy (Phantom, Solflare, etc.)
- Mint a dance move NFT (name, video hash, royalty)
- Real on‑chain transaction (SOL transfer to treasury PDA)
- View transaction status and link to Solscan devnet
- Responsive design with TypeScript + Tailwind CSS

## Tech Stack

- Next.js 14
- TypeScript
- Tailwind CSS
- @privy-io/react-auth
- @solana/web3.js
- Anchor (for future x402 integration)

## Environment Variables

When deploying to Vercel (or running locally), set:

```
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
NEXT_PUBLIC_SOLANA_RPC=https://api.devnet.solana.com
NEXT_PUBLIC_PROGRAM_ID=Dp2JcVDt4seef6LbPCtoHiD5nrHkRUFHJdBPdCUTVeDQ
NEXT_PUBLIC_URL=https://your-vercel-app.vercel.app
```

## Local Development

```bash
git clone https://github.com/arunnadarasa/moveregistry-frontend.git
cd moveregistry-frontend
yarn install
cp .env.example .env.local
# Edit .env.local with your values
yarn dev
```

Open http://localhost:3000

## Deploy to Vercel

1. Click **New Project** in Vercel
2. Import `https://github.com/arunnadarasa/moveregistry-frontend`
3. Set environment variables (above)
4. Deploy

Note: Vercel can be buggy; if issues arise, try building locally first.

## Backend (Anchor) Program

The Solana program is in the main repository: `colosseum-krump-agent/programs/move-registry/`

Deploy it first to get the program ID, then set `NEXT_PUBLIC_PROGRAM_ID` in the frontend.

## Demo Flow

1. Click **Connect Wallet (Privy)**
2. Choose Phantom or Solflare (devnet mode)
3. Fill form: Move name, Video hash (any string), Royalty (%)
4. Click **Mint Move NFT (Devnet)**
5. Approve transaction in wallet
6. See success message with Solscan link
7. Verify treasury PDA received ~0.001 SOL

## Treasury PDA

The treasury PDA is derived as:

```ts
const [treasury] = PublicKey.findProgramAddressSync(
  [Buffer.from('treasury')],
  new PublicKey(PROGRAM_ID)
);
```

You can view it on Solscan devnet.

## Future: x402 Verification

The API route `/api/verify-x402` is a placeholder for PayAI integration. When ready, replace the simulation with real x402 invoice handling.

## License

MIT
