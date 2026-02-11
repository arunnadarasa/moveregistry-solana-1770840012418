# Deploying the Anchor Program (for Judges)

This guide helps you deploy the `dance_skill_registry` program to Solana devnet so the frontend demo can interact with it.

## Prerequisites

- **Solana CLI** installed and configured  
  `sh -c "$(curl -sSfL https://release.solana.com/v1.18.0/install)"`  
  Then `solana --version` to verify.
- **Anchor** installed (requires Rust)  
  `cargo install anchor-cli --git https://github.com/coral-xyz/anchor --tag v0.30.1`
- A **Solana wallet** with devnet SOL (get some from the faucet)
- The environment variable `ANCHOR_WALLET` set to your wallet keypair path (or use `--keypair` flag)

## Steps

1. **Build the program**

   ```bash
   cd programs/dance_skill_registry
   anchor build
   ```

   After build, you’ll find the `.so` file in `target/deploy/`.

2. **Deploy to devnet**

   ```bash
   anchor deploy --provider.cluster devnet
   ```

   This will ask for your keypair passphrase (if set). It deploys the program and outputs the **Program ID**.

3. **Update the frontend**

   In your Vercel project settings, add an environment variable:

   ```
   NEXT_PUBLIC_PROGRAM_ID=<your program ID from step 2>
   ```

   Redeploy the frontend (Vercel will pick up the new env var).

4. **Fund your wallet (if needed)**

   Get devnet SOL from the faucet: https://faucet.solana.com

5. **Test the frontend**

   - Open your deployed frontend URL.
   - Connect a Phantom wallet (set to devnet).
   - Mint a skill: fill in skill name, expression (text or IPFS CID), and royalty %.
   - You should see a transaction confirmation and the skill NFT appear in your wallet.

## Optional: Local Validation

You can also run the provided Anchor tests:

```bash
anchor test
```

Make sure you have the Solana test validator running (`solana-test-validator`) if you want local tests.

## Troubleshooting

- **Insufficient funds:** Ensure your devnet wallet has SOL (airdrop from faucet).
- **Program ID mismatch:** The frontend uses `NEXT_PUBLIC_PROGRAM_ID`. Double-check that it matches the deployed program ID exactly.
- **Build errors:** Ensure you have the correct Anchor version (v0.30.x) and Rust toolchain installed.

---

Once deployed, the registry is live and ready for skill minting and verification.
