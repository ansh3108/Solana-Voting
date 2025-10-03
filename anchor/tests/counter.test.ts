import * as anchor from '@coral-xyz/anchor'
import { Program } from '@coral-xyz/anchor'
import { Keypair, PublicKey } from '@solana/web3.js'
import { Counter } from '../target/types/counter'
import { Voting } from '../target/types/voting'
import { BankrunProvider, startAnchor } from "anchor-bankrun";


const IDL = require('../target/idl/voting.json');

const votingAddress = new PublicKey("Count3AcZucFDPSFBAeHkQ6AvttieKUkyJ8HiQGhQwe")

describe('Voting', () => {

  let context;
  let provider;
  let votingProgram;

  beforeAll(async () => {
    context = await startAnchor("", [{name: "voting", programId: votingAddress}], []);
  	provider = new BankrunProvider(context);

    votingProgram = new Program<Voting>(
      IDL,
      provider,
    );
  })

  
  it('Initialize Poll', async () => {

    await votingProgram.methods.initializePoll(
      new anchor.BN(1),
      "What's your favorite type of peanut butter?",
      new anchor.BN(0),
      new anchor.BN(1859412061), 
    ).rpc();

    const [pollAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, 'le', 8)],
      votingAddress,
    )

    const poll = await votingProgram.account.poll.fetch(pollAddress);

    console.log(poll)

    expect(poll.pollId.toNumber()).toEqual(1);
    expect(poll.description).toEqual("What's your favorite type of peanut butter?");
    expect(poll.pollStart.toNumber()).toBeLessThan(poll.pollEnd.toNumber());

  });

  it("initialize candidate", async() => {
    await votingProgram.methods.initializeCandidate(
      "Smooth",
      new anchor.BN(1),
    ).rpc();
    await votingProgram.methods.initializeCandidate(
      "Crunchy",
      new anchor.BN(1),
    ).rpc();

    const [cruncyAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, 'le', 8), Buffer.from("Crunchy")],
      votingAddress,
    );
    const crunchyCandidate = await votingProgram.account.candidate.fetch(cruncyAddress);
    console.log(crunchyCandidate);
    expect(crunchyCandidate.candidateVotes.toNumber()).toEqual(0);

    const [smoothAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, 'le', 8), Buffer.from("Smooth")],
      votingAddress,
    );
    const smoothCandidate = await votingProgram.account.candidate.fetch(smoothAddress);
    console.log(smoothCandidate)
    expect(smoothCandidate.candidateVotes.toNumber()).toEqual(0);
  });

  it("vote", async() => {
    
  });


})
