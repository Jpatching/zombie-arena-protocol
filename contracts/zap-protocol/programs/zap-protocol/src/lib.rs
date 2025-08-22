use anchor_lang::prelude::*;

declare_id!("6F8Tf7RqphBvHjCy1Ti9MXrXDTAULW4xEaZ2U7mMcMpZ");

#[program]
pub mod zap_protocol {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
