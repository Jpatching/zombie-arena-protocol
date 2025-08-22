use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    metadata::{
        create_metadata_accounts_v3, mpl_token_metadata::types::DataV2, CreateMetadataAccountsV3,
        Metadata as Metaplex,
    },
    token::{mint_to, Mint, MintTo, Token, TokenAccount},
};

#[derive(Accounts)]
#[instruction(weapon_type: WeaponType, rarity: WeaponRarity)]
pub struct MintWeaponNFT<'info> {
    #[account(mut)]
    pub player: Signer<'info>,
    
    #[account(
        init,
        payer = player,
        mint::decimals = 0,
        mint::authority = mint_authority,
        mint::freeze_authority = mint_authority,
    )]
    pub weapon_mint: Account<'info, Mint>,
    
    #[account(
        init,
        payer = player,
        associated_token::mint = weapon_mint,
        associated_token::authority = player,
    )]
    pub weapon_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        seeds = [b"metadata", metaplex_program.key().as_ref(), weapon_mint.key().as_ref()],
        bump,
        seeds::program = metaplex_program.key(),
    )]
    /// CHECK: Metadata account
    pub metadata_account: UncheckedAccount<'info>,
    
    #[account(
        init,
        payer = player,
        space = 8 + WeaponData::INIT_SPACE,
        seeds = [b"weapon", weapon_mint.key().as_ref()],
        bump,
    )]
    pub weapon_data: Account<'info, WeaponData>,
    
    #[account(
        seeds = [b"mint_authority"],
        bump,
    )]
    /// CHECK: PDA used as mint authority
    pub mint_authority: AccountInfo<'info>,
    
    pub metaplex_program: Program<'info, Metaplex>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn mint_weapon_nft(
    ctx: Context<MintWeaponNFT>,
    weapon_type: WeaponType,
    rarity: WeaponRarity,
) -> Result<()> {
    let weapon_data = &mut ctx.accounts.weapon_data;
    weapon_data.weapon_type = weapon_type.clone();
    weapon_data.rarity = rarity.clone();
    weapon_data.level = 1;
    weapon_data.kills = 0;
    weapon_data.is_pack_a_punched = false;
    weapon_data.owner = ctx.accounts.player.key();
    weapon_data.mint = ctx.accounts.weapon_mint.key();
    weapon_data.created_at = Clock::get()?.unix_timestamp;
    
    let base_damage = weapon_type.base_damage();
    let rarity_multiplier = rarity.damage_multiplier();
    weapon_data.damage = (base_damage as f32 * rarity_multiplier) as u32;
    
    // Mint NFT
    let seeds = &[
        b"mint_authority",
        &[ctx.bumps.mint_authority],
    ];
    let signer = &[&seeds[..]];
    
    let cpi_accounts = MintTo {
        mint: ctx.accounts.weapon_mint.to_account_info(),
        to: ctx.accounts.weapon_account.to_account_info(),
        authority: ctx.accounts.mint_authority.to_account_info(),
    };
    let cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        cpi_accounts,
        signer,
    );
    mint_to(cpi_ctx, 1)?;
    
    // Create metadata
    let metadata_name = format!("{} {}", rarity.to_string(), weapon_type.to_string());
    let metadata_symbol = "ZAP-WPN";
    let metadata_uri = format!(
        "https://api.zombiearena.io/weapon/{}/{}.json",
        weapon_type.to_string().to_lowercase(),
        ctx.accounts.weapon_mint.key()
    );
    
    let metadata_accounts = CreateMetadataAccountsV3 {
        metadata: ctx.accounts.metadata_account.to_account_info(),
        mint: ctx.accounts.weapon_mint.to_account_info(),
        mint_authority: ctx.accounts.mint_authority.to_account_info(),
        update_authority: ctx.accounts.mint_authority.to_account_info(),
        payer: ctx.accounts.player.to_account_info(),
        system_program: ctx.accounts.system_program.to_account_info(),
        rent: ctx.accounts.rent.to_account_info(),
    };
    
    let data_v2 = DataV2 {
        name: metadata_name,
        symbol: metadata_symbol.to_string(),
        uri: metadata_uri,
        seller_fee_basis_points: 250, // 2.5% royalty
        creators: None,
        collection: None,
        uses: None,
    };
    
    let cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.metaplex_program.to_account_info(),
        metadata_accounts,
        signer,
    );
    
    create_metadata_accounts_v3(cpi_ctx, data_v2, true, true, None)?;
    
    msg!("Minted {} {} weapon NFT", rarity.to_string(), weapon_type.to_string());
    Ok(())
}

#[derive(Accounts)]
pub struct PackAPunchWeapon<'info> {
    #[account(mut)]
    pub player: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"weapon", weapon_mint.key().as_ref()],
        bump,
        constraint = weapon_data.owner == player.key(),
    )]
    pub weapon_data: Account<'info, WeaponData>,
    
    pub weapon_mint: Account<'info, Mint>,
    
    #[account(
        mut,
        constraint = player_token_account.owner == player.key(),
    )]
    pub player_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub zap_mint: Account<'info, Mint>,
    
    pub token_program: Program<'info, Token>,
}

pub fn pack_a_punch_weapon(ctx: Context<PackAPunchWeapon>) -> Result<()> {
    let weapon_data = &mut ctx.accounts.weapon_data;
    
    require!(
        !weapon_data.is_pack_a_punched,
        ErrorCode::AlreadyPackAPunched
    );
    
    // Burn tokens for upgrade
    let pack_a_punch_cost = 5000u64;
    let cpi_accounts = anchor_spl::token::Burn {
        mint: ctx.accounts.zap_mint.to_account_info(),
        from: ctx.accounts.player_token_account.to_account_info(),
        authority: ctx.accounts.player.to_account_info(),
    };
    let cpi_ctx = CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts);
    anchor_spl::token::burn(cpi_ctx, pack_a_punch_cost)?;
    
    // Upgrade weapon
    weapon_data.is_pack_a_punched = true;
    weapon_data.damage *= 2;
    weapon_data.level += 1;
    
    msg!("Pack-a-Punched weapon: {}", weapon_data.mint);
    Ok(())
}

#[account]
#[derive(InitSpace)]
pub struct WeaponData {
    pub weapon_type: WeaponType,
    pub rarity: WeaponRarity,
    pub level: u8,
    pub damage: u32,
    pub kills: u64,
    pub is_pack_a_punched: bool,
    pub owner: Pubkey,
    pub mint: Pubkey,
    pub created_at: i64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq, InitSpace)]
pub enum WeaponType {
    // Assault Rifles
    AK47,
    M16,
    Galil,
    FAMAS,
    // SMGs
    MP40,
    AK74u,
    MP5,
    // Shotguns
    Olympia,
    SPAS12,
    // Snipers
    L96A1,
    Dragunov,
    // Wonder Weapons
    Raygun,
    Thundergun,
    WunderWaffe,
}

impl WeaponType {
    pub fn base_damage(&self) -> u32 {
        match self {
            WeaponType::AK47 => 150,
            WeaponType::M16 => 140,
            WeaponType::Galil => 145,
            WeaponType::FAMAS => 135,
            WeaponType::MP40 => 100,
            WeaponType::AK74u => 110,
            WeaponType::MP5 => 105,
            WeaponType::Olympia => 500,
            WeaponType::SPAS12 => 450,
            WeaponType::L96A1 => 1000,
            WeaponType::Dragunov => 900,
            WeaponType::Raygun => 1500,
            WeaponType::Thundergun => 10000,
            WeaponType::WunderWaffe => 5000,
        }
    }
    
    pub fn to_string(&self) -> &'static str {
        match self {
            WeaponType::AK47 => "AK-47",
            WeaponType::M16 => "M16",
            WeaponType::Galil => "Galil",
            WeaponType::FAMAS => "FAMAS",
            WeaponType::MP40 => "MP40",
            WeaponType::AK74u => "AK-74u",
            WeaponType::MP5 => "MP5",
            WeaponType::Olympia => "Olympia",
            WeaponType::SPAS12 => "SPAS-12",
            WeaponType::L96A1 => "L96A1",
            WeaponType::Dragunov => "Dragunov",
            WeaponType::Raygun => "Ray Gun",
            WeaponType::Thundergun => "Thundergun",
            WeaponType::WunderWaffe => "Wunderwaffe DG-2",
        }
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq, InitSpace)]
pub enum WeaponRarity {
    Common,
    Uncommon,
    Rare,
    Epic,
    Legendary,
    Mythic,
}

impl WeaponRarity {
    pub fn damage_multiplier(&self) -> f32 {
        match self {
            WeaponRarity::Common => 1.0,
            WeaponRarity::Uncommon => 1.2,
            WeaponRarity::Rare => 1.5,
            WeaponRarity::Epic => 2.0,
            WeaponRarity::Legendary => 2.5,
            WeaponRarity::Mythic => 3.0,
        }
    }
    
    pub fn to_string(&self) -> &'static str {
        match self {
            WeaponRarity::Common => "Common",
            WeaponRarity::Uncommon => "Uncommon",
            WeaponRarity::Rare => "Rare",
            WeaponRarity::Epic => "Epic",
            WeaponRarity::Legendary => "Legendary",
            WeaponRarity::Mythic => "Mythic",
        }
    }
}