use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

#[derive(Accounts)]
#[instruction(entry_fee: u64, max_players: u32, end_time: i64)]
pub struct CreateTournament<'info> {
    #[account(mut)]
    pub organizer: Signer<'info>,
    
    #[account(
        init,
        payer = organizer,
        space = 8 + Tournament::INIT_SPACE,
        seeds = [b"tournament", organizer.key().as_ref(), &Clock::get()?.unix_timestamp.to_le_bytes()],
        bump,
    )]
    pub tournament: Account<'info, Tournament>,
    
    #[account(
        init,
        payer = organizer,
        token::mint = mint,
        token::authority = tournament,
        seeds = [b"prize_pool", tournament.key().as_ref()],
        bump,
    )]
    pub prize_pool: Account<'info, TokenAccount>,
    
    pub mint: Account<'info, anchor_spl::token::Mint>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn create_tournament(
    ctx: Context<CreateTournament>,
    entry_fee: u64,
    max_players: u32,
    end_time: i64,
) -> Result<()> {
    let tournament = &mut ctx.accounts.tournament;
    tournament.organizer = ctx.accounts.organizer.key();
    tournament.entry_fee = entry_fee;
    tournament.max_players = max_players;
    tournament.current_players = 0;
    tournament.prize_pool = 0;
    tournament.status = TournamentStatus::Open;
    tournament.start_time = Clock::get()?.unix_timestamp;
    tournament.end_time = end_time;
    tournament.bump = ctx.bumps.tournament;
    tournament.prize_pool_bump = ctx.bumps.prize_pool;
    
    msg!("Tournament created with entry fee: {} $ZAP", entry_fee);
    Ok(())
}

#[derive(Accounts)]
pub struct JoinTournament<'info> {
    #[account(mut)]
    pub player: Signer<'info>,
    
    #[account(
        mut,
        constraint = tournament.status == TournamentStatus::Open,
        constraint = tournament.current_players < tournament.max_players,
    )]
    pub tournament: Account<'info, Tournament>,
    
    #[account(
        init,
        payer = player,
        space = 8 + TournamentEntry::INIT_SPACE,
        seeds = [b"tournament_entry", tournament.key().as_ref(), player.key().as_ref()],
        bump,
    )]
    pub tournament_entry: Account<'info, TournamentEntry>,
    
    #[account(
        mut,
        constraint = player_token_account.owner == player.key(),
    )]
    pub player_token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        seeds = [b"prize_pool", tournament.key().as_ref()],
        bump = tournament.prize_pool_bump,
    )]
    pub prize_pool: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn join_tournament(ctx: Context<JoinTournament>) -> Result<()> {
    let tournament = &mut ctx.accounts.tournament;
    let entry = &mut ctx.accounts.tournament_entry;
    
    // Transfer entry fee
    let cpi_accounts = Transfer {
        from: ctx.accounts.player_token_account.to_account_info(),
        to: ctx.accounts.prize_pool.to_account_info(),
        authority: ctx.accounts.player.to_account_info(),
    };
    let cpi_ctx = CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts);
    token::transfer(cpi_ctx, tournament.entry_fee)?;
    
    // Update tournament
    tournament.current_players += 1;
    tournament.prize_pool += tournament.entry_fee;
    
    // Initialize entry
    entry.player = ctx.accounts.player.key();
    entry.tournament = tournament.key();
    entry.highest_round = 0;
    entry.total_kills = 0;
    entry.joined_at = Clock::get()?.unix_timestamp;
    entry.bump = ctx.bumps.tournament_entry;
    
    msg!("Player joined tournament. Total players: {}", tournament.current_players);
    Ok(())
}

#[derive(Accounts)]
pub struct UpdateTournamentScore<'info> {
    #[account(mut)]
    pub player: Signer<'info>,
    
    #[account(
        constraint = tournament.status == TournamentStatus::Active,
    )]
    pub tournament: Account<'info, Tournament>,
    
    #[account(
        mut,
        seeds = [b"tournament_entry", tournament.key().as_ref(), player.key().as_ref()],
        bump = tournament_entry.bump,
        constraint = tournament_entry.player == player.key(),
    )]
    pub tournament_entry: Account<'info, TournamentEntry>,
}

pub fn update_tournament_score(
    ctx: Context<UpdateTournamentScore>,
    round: u32,
    kills: u64,
) -> Result<()> {
    let entry = &mut ctx.accounts.tournament_entry;
    
    if round > entry.highest_round {
        entry.highest_round = round;
    }
    entry.total_kills += kills;
    
    msg!("Updated tournament score - Round: {}, Total Kills: {}", round, entry.total_kills);
    Ok(())
}

#[derive(Accounts)]
pub struct DistributePrizes<'info> {
    #[account(
        mut,
        constraint = tournament.organizer == organizer.key(),
        constraint = tournament.status == TournamentStatus::Ended,
    )]
    pub tournament: Account<'info, Tournament>,
    
    pub organizer: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"prize_pool", tournament.key().as_ref()],
        bump = tournament.prize_pool_bump,
    )]
    pub prize_pool: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub winner_token_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

pub fn distribute_prizes(ctx: Context<DistributePrizes>) -> Result<()> {
    let tournament = &mut ctx.accounts.tournament;
    
    let first_place_prize = tournament.prize_pool * 50 / 100; // 50%
    let second_place_prize = tournament.prize_pool * 30 / 100; // 30%
    let third_place_prize = tournament.prize_pool * 20 / 100; // 20%
    
    // Transfer to winner (simplified - in reality would need to track rankings)
    let seeds = &[
        b"tournament",
        tournament.organizer.as_ref(),
        &tournament.start_time.to_le_bytes(),
        &[tournament.bump],
    ];
    let signer = &[&seeds[..]];
    
    let cpi_accounts = Transfer {
        from: ctx.accounts.prize_pool.to_account_info(),
        to: ctx.accounts.winner_token_account.to_account_info(),
        authority: tournament.to_account_info(),
    };
    let cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        cpi_accounts,
        signer,
    );
    token::transfer(cpi_ctx, first_place_prize)?;
    
    tournament.status = TournamentStatus::Distributed;
    
    msg!("Distributed {} $ZAP in prizes", tournament.prize_pool);
    Ok(())
}

#[account]
#[derive(InitSpace)]
pub struct Tournament {
    pub organizer: Pubkey,
    pub entry_fee: u64,
    pub max_players: u32,
    pub current_players: u32,
    pub prize_pool: u64,
    pub status: TournamentStatus,
    pub start_time: i64,
    pub end_time: i64,
    pub bump: u8,
    pub prize_pool_bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct TournamentEntry {
    pub player: Pubkey,
    pub tournament: Pubkey,
    pub highest_round: u32,
    pub total_kills: u64,
    pub joined_at: i64,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq, InitSpace)]
pub enum TournamentStatus {
    Open,
    Active,
    Ended,
    Distributed,
}

// Guild System
#[derive(Accounts)]
#[instruction(name: String, description: String)]
pub struct CreateGuild<'info> {
    #[account(mut)]
    pub leader: Signer<'info>,
    
    #[account(
        init,
        payer = leader,
        space = 8 + Guild::INIT_SPACE,
        seeds = [b"guild", name.as_bytes()],
        bump,
    )]
    pub guild: Account<'info, Guild>,
    
    #[account(
        init,
        payer = leader,
        token::mint = mint,
        token::authority = guild,
        seeds = [b"guild_treasury", guild.key().as_ref()],
        bump,
    )]
    pub guild_treasury: Account<'info, TokenAccount>,
    
    pub mint: Account<'info, anchor_spl::token::Mint>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn create_guild(
    ctx: Context<CreateGuild>,
    name: String,
    description: String,
) -> Result<()> {
    let guild = &mut ctx.accounts.guild;
    guild.name = name;
    guild.description = description;
    guild.leader = ctx.accounts.leader.key();
    guild.member_count = 1;
    guild.total_earnings = 0;
    guild.created_at = Clock::get()?.unix_timestamp;
    guild.bump = ctx.bumps.guild;
    guild.treasury_bump = ctx.bumps.guild_treasury;
    
    msg!("Guild '{}' created", guild.name);
    Ok(())
}

#[account]
#[derive(InitSpace)]
pub struct Guild {
    #[max_len(32)]
    pub name: String,
    #[max_len(200)]
    pub description: String,
    pub leader: Pubkey,
    pub member_count: u32,
    pub total_earnings: u64,
    pub created_at: i64,
    pub bump: u8,
    pub treasury_bump: u8,
}