#![allow(clippy::result_large_err)]

use anchor_lang::prelude::*;

declare_id!("Count3AcZucFDPSFBAeHkQ6AvttieKUkyJ8HiQGhQwe");

#[program]
pub mod voting {
    use super::*;

    pub fn initialize_poll(
        ctx: Context<InitializePoll>,
        poll_id: u64,
        description: String,
        poll_start: u64,
        poll_end: u64,
    ) -> Result<()> {
        let poll = &mut ctx.accounts.poll;
        poll.poll_id = poll_id;
        poll.description = description;
        poll.poll_start = poll_start;
        poll.poll_end = poll_end;
        poll.candidate_amount = 0;
        Ok(())
    }

    pub fn initialize_candidate(
        ctx: Context<InitializeCandidate>,
        poll_id: u64,
        candidate_name: String,
    ) -> Result<()> {
        let poll = &mut ctx.accounts.poll;
        let candidate = &mut ctx.accounts.candidate;

        candidate.candidate_name = candidate_name;
        candidate.candidate_votes = 0;

        poll.candidate_amount += 1;
        msg!("Candidate initialized for poll {}", poll_id);
        Ok(())
    }

    pub fn vote(ctx: Context<Vote>, candidate_name: String, poll_id: u64) -> Result<()> {
        let candidate = &mut ctx.accounts.candidate;
        candidate.candidate_votes += 1;

        msg!("Voted for candidate: {} ", candidate_name);
        msg!("Total votes: {}", candidate.candidate_votes);

        Ok(())
    }
}

#[account]
pub struct Poll {
    pub poll_id: u64,
    pub description: String,
    pub poll_start: u64,
    pub poll_end: u64,
    pub candidate_amount: u64,
}

#[account]
pub struct Candidate {
    pub candidate_name: String,
    pub candidate_votes: u64,
}

#[derive(Accounts)]
#[instruction(poll_id: u64)]
pub struct InitializePoll<'info> {
    #[account(
        init,
        payer = signer,
        space = 8 + 8 + 4 + 200 + 8 + 8 + 8,
        seeds = [poll_id.to_le_bytes().as_ref()],
        bump
    )]
    pub poll: Account<'info, Poll>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(poll_id: u64, candidate_name: String)]
pub struct InitializeCandidate<'info> {
    #[account(
        mut,
        seeds = [poll_id.to_le_bytes().as_ref()],
        bump
    )]
    pub poll: Account<'info, Poll>,

    #[account(
        init,
        payer = signer,
        space = 8 + 4 + 100 + 8,
        seeds = [poll_id.to_le_bytes().as_ref(), candidate_name.as_bytes()],
        bump
    )]
    pub candidate: Account<'info, Candidate>,

    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(candidate_name: String, poll_id: u64)]
pub struct Vote<'info> {
    pub signer: Signer<'info>,

    #[account(
        mut,
        seeds = [poll_id.to_le_bytes().as_ref()],
        bump
    )]
    pub poll: Account<'info, Poll>,

    #[account(
        mut,
        seeds = [poll_id.to_le_bytes().as_ref(), candidate_name.as_bytes()],
        bump
    )]
    pub candidate: Account<'info, Candidate>,
}
