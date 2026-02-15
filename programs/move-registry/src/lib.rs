use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("Dp2JcVDt4seef6LbPCtoHiD5nrHkRUFHJdBPdCUTVeDQ");

#[program]
pub mod move_registry {
    use super::*;

    /// Mint a new move NFT. Creates a new mint, a metadata account, and a SkillAccount account.
    /// UPDATED: The payer (can be a sponsor) pays for account rent. Creator is the skill owner.
    /// The treasury PDA receives a small mint fee.
    pub fn mint_skill(
        ctx: Context<MintMove>,
        skill_name: String,
        expression: String,
        royalty_percent: u8, // 0-100
    ) -> Result<()> {
        let now = Clock::get()?.unix_timestamp;

        // Transfer mint fee to treasury
        let treasury = &ctx.accounts.treasury;
        let mint_fee = 10_000; // 0.01 USDC (assuming 6 decimals, adjust)
        // TODO: actual token transfer using CPI to USDC mint

        // Initialize SkillAccount
        let skill_data = &mut ctx.accounts.skill_data;
        skill_data.creator = ctx.accounts.creator.key();
        skill_data.skill_name = skill_name.clone();
        skill_data.expression = expression;
        skill_data.timestamp = now;
        skill_data.royalty_percent = royalty_percent;
        skill_data.verified = false;
        skill_data.mint = ctx.accounts.skill_mint.key();
        skill_data.treasury = *treasury.key;

        // NFT metadata already created via Metaplex instruction (outside program)
        // We simply set data in our account.

        emit!(SkillMinted {
            creator: ctx.accounts.creator.key(),
            mint: ctx.accounts.skill_mint.key(),
            skill_name: skill_name.clone(),
        });

        Ok(())
    }

    /// Verify a move by paying a small x402 fee to the treasury.
    /// The program marks the move as verified.
    pub fn verify_skill(ctx: Context<VerifyMove>) -> Result<()> {
        let skill_data = &mut ctx.accounts.skill_data;
        require!(!skill_data.verified, MoveRegistryError::AlreadyVerified);

        // Payment verification is handled off‑chain via x402; here we just trust the caller.
        // In production, you would validate a signed payment proof.
        let verifier = &ctx.accounts.verifier;
        msg!("Move verified by {}", verifier.key());

        skill_data.verified = true;
        emit!(SkillVerified { mint: skill_data.mint });

        Ok(())
    }

    /// License a move for commercial use. The payer sends a royalty payment to the creator.
    /// The treasury takes a small platform fee if desired.
    pub fn license_skill(ctx: Context<LicenseMove>, amount: u64) -> Result<()> {
        let skill_data = &ctx.accounts.skill_data;
        require!(skill_data.verified, MoveRegistryError::NotVerified);
        let creator = skill_data.creator;
        let royalty_percent = skill_data.royalty_percent as u64;
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

        emit!(SkillLicensed {
            mint: skill_data.mint,
            payer: ctx.accounts.payer.key(),
            amount,
            royalty: royalty_amount,
        });

        Ok(())
    }
}

/// Accounts for MintMove - UPDATED to support sponsored transactions
#[derive(Accounts)]
pub struct MintMove<'info> {
    /// The payer who pays for account rent (can be sponsor/fee payer)
    #[account(mut)]
    pub payer: Signer<'info>,
    /// The creator/owner of the skill (must sign to prove ownership)
    #[account(mut)]
    pub creator: Signer<'info>,
    /// CHECK: This is the mint account for the move NFT (Metaplex)
    #[account(mut)]
    pub skill_mint: UncheckedAccount<'info>,
    /// The treasury PDA that receives mint fees
    #[account(
        seeds = [b"treasury"],
        bump,
    )]
    pub treasury: SystemAccount<'info>,
    /// The skill data account - payer pays for rent, not creator
    #[account(
        init,
        payer = payer,  // CHANGED: payer pays rent instead of creator
        space = 8 + SkillAccount::INIT_SPACE,
        seeds = [b"skilldata", skill_mint.key().as_ref()],
        bump
    )]
    pub skill_data: Account<'info, SkillAccount>,
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
    pub skill_data: Account<'info, SkillAccount>,
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
    pub skill_data: Account<'info, SkillAccount>,
    pub token_program: Program<'info, Token>,
}

/// Move metadata stored on-chain
#[account]
#[derive(Debug, PartialEq, InitSpace)]
pub struct SkillAccount {
    pub creator: Pubkey,
    #[max_len(64)]
    pub skill_name: String,    // max 64 chars
    #[max_len(128)]
    pub expression: String,   // IPFS CID or Arweave hash
    pub timestamp: i64,
    pub royalty_percent: u8,
    pub verified: bool,
    pub mint: Pubkey,
    pub treasury: Pubkey,
}

/// Events
#[event]
pub struct SkillMinted {
    pub creator: Pubkey,
    pub mint: Pubkey,
    pub skill_name: String,
}

#[event]
pub struct SkillVerified {
    pub mint: Pubkey,
}

#[event]
pub struct SkillLicensed {
    pub mint: Pubkey,
    pub payer: Pubkey,
    pub amount: u64,
    pub royalty: u64,
}

#[error_code]
pub enum MoveRegistryError {
    #[msg("Skill already verified")]
    AlreadyVerified,
    #[msg("Skill not verified")]
    NotVerified,
}
