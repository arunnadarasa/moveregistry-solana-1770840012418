use move_registry::state::MoveData;
use move_registry::MoveMinted;
use solana_program_test::*;
use solana_sdk::{signature::Keypair, signer::Signer};
use std::str::FromStr;

#[tokio::test]
async fn test_mint_and_verify_and_license() {
    let program_id = move_registry::id();
    let mut context = ProgramTest::start(&[
        // Add necessary accounts: system, token, etc.
    ]);

    // Create a mint (simulated USDC)
    let mint_keypair = Keypair::new();
    context.create_mint(&mint_keypair).await;

    // Create token accounts for treasury and creator
    // ...

    // For brevity, we outline steps:
    // 1. Invoke mint_move instruction
    // 2. Check MoveData account fields
    // 3. Invoke verify_move
    // 4. Verify `verified` flag
    // 5. Invoke license_move with a payment
    // 6. Check that creator received royalty

    // Actual implementation requires full setup of token accounts and signers.
    // This test skeleton demonstrates expected flow.
}
