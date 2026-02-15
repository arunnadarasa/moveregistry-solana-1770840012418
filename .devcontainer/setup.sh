#!/bin/bash
set -e

echo "Installing Solana CLI..."
sh -c "$(curl -sSfL https://release.solana.com/v1.18.18/install)"
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
echo 'export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"' >> ~/.bashrc

echo "Installing Anchor..."
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install 0.30.1
avm use 0.30.1

echo "Configuring Solana for devnet..."
solana config set --url https://api.devnet.solana.com

echo "Setup complete! Run 'solana-keygen new' to create a keypair if needed."
