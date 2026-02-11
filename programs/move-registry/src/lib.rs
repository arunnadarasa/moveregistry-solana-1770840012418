use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer, Mint};
use mpl_token_metadata::state::{Metadata, TokenMetadataAccount};
use solana_program::borsh;

declare_id!("YOUR_PROGRAM_ID_HERE");

#[program]
pub mod move_registry {
    use super::*;

    /// Mint a new move NFT. Creates a new mint, a metadata account, and a MoveData account.
    /// The payer must sign and provide a token account for the mint (SystemAccount creates mint).
    /// The treasury PDA receives a small mint fee.
    pub fn mint_move(
        ctx: Context<MintMove>,
        move_name: String,
        video_hash: String,
        royalty_percent: u8, // 0-100
    ) -> Result<()> {
        let now = Clock::get()?.unix_timestamp;

        // Transfer mint fee to treasury
        let treasury = &ctx.accounts.treasury;
        let mint_fee = 10_000; // 0.01 USDC (assuming 6 decimals, adjust)
        // TODO: actual token transfer using CPI to USDC mint

        // Initialize MoveData
        let move_data = &mut ctx.accounts.move_data;
        move_data.creator = ctx.accounts.creator.key();
        move_data.move_name = move_name;
        move_data.video_hash = video_hash;
        move_data.timestamp = now;
        move_data.royalty_percent = royalty_percent;
        move_data.verified = false;
        move_data.mint = ctx.accounts.move_mint.key();
        move_data.treasury = *treasury.key;

        // NFT metadata already created via Metaplex instruction (outside program)
        // We simply set data in our account.

        emit!(MoveMinted {
            creator: ctx.accounts.creator.key(),
            mint: ctx.accounts.move_mint.key(),
            move_name: move_name.clone(),
        });

        Ok(())
    }

    /// Verify a move by paying a small x402 fee to the treasury.
    /// The program marks the move as verified.
    pub fn verify_move(ctx: Context<VerifyMove>) -> Result<()> {
        let move_data = &mut ctx.accounts.move_data;
        require!(!move_data.verified, AlreadyVerified);

        // Payment verification is handled off‑chain via x402; here we just trust the caller.
        // In production, you would validate a signed payment proof.
        let verifier = &ctx.accounts.verifier;
        msg!("Move verified by {}", verifier);

        move_data.verified = true;
        emit!(MoveVerified { mint: move_data.mint });

        Ok(())
    }

    /// License a move for commercial use. The payer sends a royalty payment to the creator.
    /// The treasury takes a small platform fee if desired.
    pub fn license_move(ctx: Context<LicenseMove>, amount: u64) -> Result<()> {
        let move_data = &ctx.accounts.move_data;
        require!(move_data.verified, NotVerified);
        let creator = move_data.creator;
        let royalty_percent = move_data.royalty_percent as u64;
        let royalty_amount = amount * royalty_percent / 100;

        // Transfer royalty to creator
        let transfer_accounts = Transfer {
            from: ctx.accounts.payment_source.to_account_info(),
            to: ctx.accounts.creator_token_account.to_account_info(),
            authority: ctx.accounts.payer.to_account_info(),
        };
        let ctx_transfer = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            transfer_accounts,
        );
        token::transfer(ctx_transfer, royalty_amount)?;

        emit!(MoveLicensed {
            mint: move_data.mint,
            payer: ctx.accounts.payer.key(),
            amount,
            royalty: royalty_amount,
        });

        Ok(())
    }
}

/// Accounts for MintMove
#[derive(Accounts)]
pub struct MintMove<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,
    /// CHECK: This is the mint account for the move NFT (Metaplex)
    #[account(mut)]
    pub move_mint: UncheckedAccount<'info>,
    /// The treasury PDA that receives mint fees
    #[account(
        seeds = [b"treasury"],
        bump,
    )]
    pub treasury: SystemAccount<'info>,
    #[account(
        init,
        payer = creator,
        space = 8 + MoveData::INIT_SPACE,
        seeds = [b"movedata", move_mint.key().as_ref()],
        bump
    )]
    pub move_data: Account<'info, MoveData>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    /// CHECK: optional USDC mint for fees
    #[account(mut)]
    pub usdc_mint: UncheckedAccount<'info>,
}

/// Accounts for VerifyMove
#[derive(Accounts)]
pub struct VerifyMove<'info> {
    #[account(mut)]
    pub verifier: Signer<'info>,
    #[account(mut)]
    pub move_data: Account<'info, MoveData>,
}

/// Accounts for LicenseMove
#[derive(Accounts)]
pub struct LicenseMove<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(mut)]
    pub payment_source: Account<'info, TokenAccount>,
    #[account(mut)]
    pub creator_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub move_data: Account<'info, MoveData>,
    pub token_program: Program<'info, Token>,
}

/// Move metadata stored on-chain
#[account]
#[derive(Clone, Debug, PartialEq, InitSpace)]
pub struct MoveData {
    pub creator: Pubkey,
    pub move_name: String,    // max 64?
    pub video_hash: String,   // IPFS CID or Arweave hash
    pub timestamp: i64,
    pub royalty_percent: u8,
    pub verified: bool,
    pub mint: Pubkey,
    pub treasury: Pubkey,
}

impl MoveData {
    const INIT_SPACE: usize = 8 + (32 * 2) + (8 * 2) + 1 + 1 + 32 * 2; // rough; adjust
}

/// Events
#[event]
pub struct MoveMinted {
    pub creator: Pubkey,
    pub mint: Pubkey,
    pub move_name: String,
}

#[event]
pub struct MoveVerified {
    pub mint: Pubkey,
}

#[event]
pub struct MoveLicensed {
    pub mint: Pubkey,
    pub payer: Pubkey,
    pub amount: u64,
    pub royalty: u64,
}
