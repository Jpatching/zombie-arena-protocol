use anchor_lang::prelude::*;
use anchor_spl::token::{self, Burn, Mint, MintTo, Token, TokenAccount, Transfer};

pub mod nft;
pub mod tournament;

use nft::*;
use tournament::*;

declare_id!("ZAPxxx111111111111111111111111111111111111");

#[program]
pub mod zombie_arena_protocol {
    use super::*;

    pub fn initialize_token(
        ctx: Context<InitializeToken>,
        initial_supply: u64,
        decimals: u8,
    ) -> Result<()> {
        let token_data = &mut ctx.accounts.token_data;
        token_data.admin = ctx.accounts.admin.key();
        token_data.mint = ctx.accounts.mint.key();
        token_data.total_burned = 0;
        token_data.bump = ctx.bumps.token_data;
        
        msg!("$ZAP Token initialized with supply: {}", initial_supply);
        Ok(())
    }

    pub fn mint_tokens(
        ctx: Context<MintTokens>,
        amount: u64,
    ) -> Result<()> {
        require!(
            ctx.accounts.admin.key() == ctx.accounts.token_data.admin,
            ErrorCode::Unauthorized
        );

        let cpi_accounts = MintTo {
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.token_account.to_account_info(),
            authority: ctx.accounts.mint_authority.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts);
        token::mint_to(cpi_ctx, amount)?;
        
        Ok(())
    }

    pub fn burn_for_perk(
        ctx: Context<BurnForPerk>,
        amount: u64,
        perk_type: PerkType,
    ) -> Result<()> {
        let cpi_accounts = Burn {
            mint: ctx.accounts.mint.to_account_info(),
            from: ctx.accounts.player_token_account.to_account_info(),
            authority: ctx.accounts.player.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts);
        token::burn(cpi_ctx, amount)?;

        let token_data = &mut ctx.accounts.token_data;
        token_data.total_burned += amount;

        let player_state = &mut ctx.accounts.player_state;
        player_state.activate_perk(perk_type)?;
        
        msg!("Burned {} $ZAP for perk: {:?}", amount, perk_type);
        Ok(())
    }

    pub fn create_player_state(
        ctx: Context<CreatePlayerState>,
    ) -> Result<()> {
        let player_state = &mut ctx.accounts.player_state;
        player_state.player = ctx.accounts.player.key();
        player_state.total_kills = 0;
        player_state.highest_round = 0;
        player_state.tokens_earned = 0;
        player_state.active_perks = vec![];
        player_state.bump = ctx.bumps.player_state;
        
        Ok(())
    }

    pub fn earn_tokens(
        ctx: Context<EarnTokens>,
        amount: u64,
        reason: EarnReason,
    ) -> Result<()> {
        let cpi_accounts = MintTo {
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.player_token_account.to_account_info(),
            authority: ctx.accounts.mint_authority.to_account_info(),
        };
        
        let seeds = &[
            b"mint_authority",
            ctx.accounts.mint.key().as_ref(),
            &[ctx.accounts.mint_authority.bump],
        ];
        let signer = &[&seeds[..]];
        
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
            signer,
        );
        token::mint_to(cpi_ctx, amount)?;

        let player_state = &mut ctx.accounts.player_state;
        player_state.tokens_earned += amount;
        
        msg!("Player earned {} $ZAP for {:?}", amount, reason);
        Ok(())
    }
    
    // NFT functions
    pub fn mint_weapon_nft(
        ctx: Context<MintWeaponNFT>,
        weapon_type: WeaponType,
        rarity: WeaponRarity,
    ) -> Result<()> {
        nft::mint_weapon_nft(ctx, weapon_type, rarity)
    }
    
    pub fn pack_a_punch_weapon(ctx: Context<PackAPunchWeapon>) -> Result<()> {
        nft::pack_a_punch_weapon(ctx)
    }
    
    // Tournament functions
    pub fn create_tournament(
        ctx: Context<CreateTournament>,
        entry_fee: u64,
        max_players: u32,
        end_time: i64,
    ) -> Result<()> {
        tournament::create_tournament(ctx, entry_fee, max_players, end_time)
    }
    
    pub fn join_tournament(ctx: Context<JoinTournament>) -> Result<()> {
        tournament::join_tournament(ctx)
    }
    
    pub fn update_tournament_score(
        ctx: Context<UpdateTournamentScore>,
        round: u32,
        kills: u64,
    ) -> Result<()> {
        tournament::update_tournament_score(ctx, round, kills)
    }
    
    pub fn distribute_prizes(ctx: Context<DistributePrizes>) -> Result<()> {
        tournament::distribute_prizes(ctx)
    }
    
    pub fn create_guild(
        ctx: Context<CreateGuild>,
        name: String,
        description: String,
    ) -> Result<()> {
        tournament::create_guild(ctx, name, description)
    }
}

#[derive(Accounts)]
#[instruction(initial_supply: u64, decimals: u8)]
pub struct InitializeToken<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    
    #[account(
        init,
        payer = admin,
        mint::decimals = decimals,
        mint::authority = mint_authority,
    )]
    pub mint: Account<'info, Mint>,
    
    #[account(
        init,
        payer = admin,
        space = 8 + TokenData::INIT_SPACE,
        seeds = [b"token_data", mint.key().as_ref()],
        bump,
    )]
    pub token_data: Account<'info, TokenData>,
    
    #[account(
        init,
        payer = admin,
        space = 8 + 32,
        seeds = [b"mint_authority", mint.key().as_ref()],
        bump,
    )]
    /// CHECK: PDA used as mint authority
    pub mint_authority: AccountInfo<'info>,
    
    #[account(
        init,
        payer = admin,
        associated_token::mint = mint,
        associated_token::authority = admin,
    )]
    pub admin_token_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, anchor_spl::associated_token::AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct MintTokens<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    
    #[account(
        mut,
        constraint = token_data.admin == admin.key() @ ErrorCode::Unauthorized,
    )]
    pub token_data: Account<'info, TokenData>,
    
    #[account(mut)]
    pub mint: Account<'info, Mint>,
    
    #[account(
        seeds = [b"mint_authority", mint.key().as_ref()],
        bump,
    )]
    /// CHECK: PDA used as mint authority
    pub mint_authority: AccountInfo<'info>,
    
    #[account(mut)]
    pub token_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct BurnForPerk<'info> {
    #[account(mut)]
    pub player: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"player_state", player.key().as_ref()],
        bump = player_state.bump,
    )]
    pub player_state: Account<'info, PlayerState>,
    
    #[account(mut)]
    pub token_data: Account<'info, TokenData>,
    
    #[account(mut)]
    pub mint: Account<'info, Mint>,
    
    #[account(
        mut,
        constraint = player_token_account.owner == player.key(),
    )]
    pub player_token_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct CreatePlayerState<'info> {
    #[account(mut)]
    pub player: Signer<'info>,
    
    #[account(
        init,
        payer = player,
        space = 8 + PlayerState::INIT_SPACE,
        seeds = [b"player_state", player.key().as_ref()],
        bump,
    )]
    pub player_state: Account<'info, PlayerState>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct EarnTokens<'info> {
    #[account(mut)]
    pub player: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"player_state", player.key().as_ref()],
        bump = player_state.bump,
    )]
    pub player_state: Account<'info, PlayerState>,
    
    #[account(mut)]
    pub mint: Account<'info, Mint>,
    
    #[account(
        seeds = [b"mint_authority", mint.key().as_ref()],
        bump,
    )]
    /// CHECK: PDA used as mint authority
    pub mint_authority: AccountInfo<'info>,
    
    #[account(
        mut,
        constraint = player_token_account.owner == player.key(),
    )]
    pub player_token_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

#[account]
#[derive(InitSpace)]
pub struct TokenData {
    pub admin: Pubkey,
    pub mint: Pubkey,
    pub total_burned: u64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct PlayerState {
    pub player: Pubkey,
    pub total_kills: u64,
    pub highest_round: u32,
    pub tokens_earned: u64,
    #[max_len(10)]
    pub active_perks: Vec<PerkType>,
    pub bump: u8,
}

impl PlayerState {
    pub fn activate_perk(&mut self, perk: PerkType) -> Result<()> {
        if self.active_perks.len() >= 4 {
            return Err(ErrorCode::MaxPerksReached.into());
        }
        
        if self.active_perks.contains(&perk) {
            return Err(ErrorCode::PerkAlreadyActive.into());
        }
        
        self.active_perks.push(perk);
        Ok(())
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq, InitSpace)]
pub enum PerkType {
    Juggernog,
    SpeedCola,
    DoubleTap,
    QuickRevive,
    StaminUp,
    PHDFlopper,
    Deadshot,
    MuleKick,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, InitSpace)]
pub enum EarnReason {
    RoundSurvival,
    ZombieKill,
    Headshot,
    Assist,
    Revive,
    Challenge,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Maximum perks reached")]
    MaxPerksReached,
    #[msg("Perk already active")]
    PerkAlreadyActive,
    #[msg("Weapon already Pack-a-Punched")]
    AlreadyPackAPunched,
}