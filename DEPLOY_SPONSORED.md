# Deploying Sponsored Transaction Support

This guide deploys the updated Anchor program with separate `payer` account support for fully sponsored/walletless minting.

## What Changed

The `MintMove` instruction now has a separate `payer` account:
- **payer**: Pays for transaction fees AND account rent (can be sponsor)
- **creator**: The skill owner who signs to prove ownership

This enables users to mint without holding any SOL.

## Deployment Steps (in GitHub Codespaces)

### 1. Generate a new keypair for deployment

```bash
solana-keygen new -o deploy-keypair.json
```

### 2. Get your public key and fund it

```bash
solana address -k deploy-keypair.json
# Copy this address

# Airdrop SOL (devnet)
solana airdrop 2 $(solana address -k deploy-keypair.json) --url devnet
solana airdrop 2 $(solana address -k deploy-keypair.json) --url devnet
# Run airdrop multiple times if needed (rate limited)
```

### 3. Generate a new program keypair

```bash
solana-keygen new -o target/deploy/move_registry-keypair.json --force
```

### 4. Get the new program ID

```bash
solana address -k target/deploy/move_registry-keypair.json
```

### 5. Update the program ID in lib.rs

Edit `programs/move-registry/src/lib.rs` and replace the `declare_id!` with your new program ID:

```rust
declare_id!("YOUR_NEW_PROGRAM_ID_HERE");
```

### 6. Update Anchor.toml

Edit `Anchor.toml` and update:

```toml
[programs.devnet]
move_registry = "YOUR_NEW_PROGRAM_ID_HERE"

[provider]
cluster = "devnet"
wallet = "./deploy-keypair.json"
```

### 7. Build the program

```bash
anchor build
```

### 8. Deploy to devnet

```bash
anchor deploy --provider.cluster devnet --provider.wallet deploy-keypair.json
```

### 9. Verify deployment

```bash
solana program show YOUR_NEW_PROGRAM_ID_HERE --url devnet
```

## After Deployment

Update the frontend to use the new program ID:
1. Update `MOVE_REGISTRY_PROGRAM_ID` in `src/lib/anchor-client.ts`
2. Redeploy the frontend

## New IDL Account Order

The `mintSkill` instruction now expects accounts in this order:
1. `payer` (signer, mutable) - pays rent
2. `creator` (signer, mutable) - owns the skill
3. `skill_mint` (mutable)
4. `treasury` (PDA)
5. `skill_data` (PDA, init)
6. `system_program`
7. `token_program`
8. `usdc_mint`
