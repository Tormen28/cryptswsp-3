use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod auto_swap {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, config: SwapConfig) -> Result<()> {
        let auto_swap = &mut ctx.accounts.auto_swap;
        auto_swap.owner = ctx.accounts.owner.key();
        auto_swap.config = config;
        Ok(())
    }

    pub fn update_config(ctx: Context<UpdateConfig>, new_config: SwapConfig) -> Result<()> {
        let auto_swap = &mut ctx.accounts.auto_swap;
        require!(
            auto_swap.owner == ctx.accounts.owner.key(),
            AutoSwapError::Unauthorized
        );
        auto_swap.config = new_config;
        Ok(())
    }

    pub fn execute_swap(ctx: Context<ExecuteSwap>, amount: u64) -> Result<()> {
        let auto_swap = &mut ctx.accounts.auto_swap;
        require!(
            auto_swap.owner == ctx.accounts.owner.key(),
            AutoSwapError::Unauthorized
        );

        // Verificar límites de swap
        require!(
            amount >= auto_swap.config.min_amount,
            AutoSwapError::AmountTooSmall
        );
        require!(
            amount <= auto_swap.config.max_amount,
            AutoSwapError::AmountTooLarge
        );

        // Ejecutar transferencia
        let transfer_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.source_token_account.to_account_info(),
                to: ctx.accounts.destination_token_account.to_account_info(),
                authority: ctx.accounts.owner.to_account_info(),
            },
        );

        token::transfer(transfer_ctx, amount)?;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = owner, space = 8 + AutoSwap::LEN)]
    pub auto_swap: Account<'info, AutoSwap>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateConfig<'info> {
    #[account(mut)]
    pub auto_swap: Account<'info, AutoSwap>,
    pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct ExecuteSwap<'info> {
    #[account(mut)]
    pub auto_swap: Account<'info, AutoSwap>,
    #[account(mut)]
    pub source_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub destination_token_account: Account<'info, TokenAccount>,
    pub owner: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[account]
pub struct AutoSwap {
    pub owner: Pubkey,
    pub config: SwapConfig,
}

impl AutoSwap {
    pub const LEN: usize = 32 + SwapConfig::LEN;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy)]
pub struct SwapConfig {
    pub min_amount: u64,
    pub max_amount: u64,
    pub slippage_bps: u16,
    pub enabled: bool,
}

impl SwapConfig {
    pub const LEN: usize = 8 + 8 + 2 + 1;
}

#[error_code]
pub enum AutoSwapError {
    #[msg("No autorizado para realizar esta acción")]
    Unauthorized,
    #[msg("Monto demasiado pequeño")]
    AmountTooSmall,
    #[msg("Monto demasiado grande")]
    AmountTooLarge,
}
