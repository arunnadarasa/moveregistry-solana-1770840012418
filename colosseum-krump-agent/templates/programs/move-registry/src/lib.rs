use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use solana_program::borsh;

declare_id!("YOUR_PROGRAM_ID_HERE");

#[program]
pub mod dance_skill_registry {
    use super::*;

    /// Mint a new skill NFT. Creates a new mint and a SkillAccount.
    /// The payer covers any mint fee (optional) sent to the treasury PDA.
    pub fn mint_skill(
        ctx: Context<MintSkill>,
        skill_name: String,
        skill_expression: String, // text DSL or video URL / IPFS CID
        royalty_percent: u8, // 0-100
    ) -> Result<()> {
        let now = Clock::get()?.unix_timestamp;

        // Transfer optional mint fee to treasury (if configured)
        // For now we skip token transfer; can be added with USDC mint
        let _treasury = &ctx.accounts.treasury;

        // Initialize SkillAccount
        let skill_data = &mut ctx.accounts.skill_data;
        skill_data.creator = ctx.accounts.creator.key();
        skill_data.skill_name = skill_name;
        skill_data.skill_expression = skill_expression;
        skill_data.timestamp = now;
        skill_data.royalty_percent = royalty_percent;
        skill_data.verified = false;
        skill_data.mint = ctx.accounts.skill_mint.key();
        skill_data.treasury = *ctx.accounts.treasury.key;

        emit!(SkillMinted {
            creator: ctx.accounts.creator.key(),
            mint: ctx.accounts.skill_mint.key(),
            skill_name: skill_name.clone(),
        });

        Ok(())
    }

    /// Verify a skill by paying a small x402 fee to the treasury (via PayAI facilitator).
    /// The program marks the skill as verified.
    pub fn verify_skill(ctx: Context<VerifySkill>) -> Result<()> {
        let skill_data = &mut ctx.accounts.skill_data;
        require!(!skill_data.verified, AlreadyVerified);

        // In production, off‑chain x402 proof would be validated here.
        let verifier = &ctx.accounts.verifier;
        msg!("Skill verified by {}", verifier);

        skill_data.verified = true;
        emit!(SkillVerified { mint: skill_data.mint });

        Ok(())
    }

    /// License a skill for use. The payer sends a royalty payment to the creator.
    pub fn license_skill(ctx: Context<LicenseSkill>, amount: u64) -> Result<()> {
        let skill_data = &ctx.accounts.skill_data;
        require!(skill_data.verified, NotVerified);
        let creator = skill_data.creator;
        let royalty_percent = skill_data.royalty_percent as u64;
        let royalty_amount = amount * royalty_percent / 100;

        // Transfer royalty to creator's token account
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

/// Accounts for MintSkill
#[derive(Accounts)]
pub struct MintSkill<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,
    /// CHECK: mint account for the skill NFT (Metaplex)
    #[account(mut)]
    pub skill_mint: UncheckedAccount<'info>,
    /// Treasury PDA that can receive fees (optional)
    #[account(
        seeds = [b"treasury"],
        bump,
    )]
    pub treasury: SystemAccount<'info>,
    #[account(
        init,
        payer = creator,
        space = 8 + SkillAccount::INIT_SPACE,
        seeds = [b"skilldata", skill_mint.key().as_ref()],
        bump
    )]
    pub skill_data: Account<'info, SkillAccount>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    /// Optional USDC mint if you want to require fee transfers
    #[account(mut)]
    pub usdc_mint: UncheckedAccount<'info>,
}

/// Accounts for VerifySkill
#[derive(Accounts)]
pub struct VerifySkill<'info> {
    #[account(mut)]
    pub verifier: Signer<'info>,
    #[account(mut)]
    pub skill_data: Account<'info, SkillAccount>,
}

/// Accounts for LicenseSkill
#[derive(Accounts)]
pub struct LicenseSkill<'info> {
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

/// On‑chain skill metadata
#[account]
#[derive(Clone, Debug, PartialEq, InitSpace)]
pub struct SkillAccount {
    pub creator: Pubkey,
    pub skill_name: String,     // name of the dance skill
    pub skill_expression: String, // text DSL or video URL / IPFS CID
    pub timestamp: i64,
    pub royalty_percent: u8,
    pub verified: bool,
    pub mint: Pubkey,
    pub treasury: Pubkey,
}

impl SkillAccount {
    const INIT_SPACE: usize = 8 + (32 * 2) + (8 * 2) + 1 + 1 + 32 * 2;
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
