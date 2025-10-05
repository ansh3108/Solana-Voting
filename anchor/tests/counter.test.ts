import * as anchor from '@coral-xyz/anchor'
import { Program } from '@coral-xyz/anchor'
import { PublicKey } from '@solana/web3.js'
import { Voting } from '../target/types/voting'
import { BankrunProvider, startAnchor } from "anchor-bankrun"

const IDL = require('../target/idl/voting.json')
const votingAddress = new PublicKey("Count3AcZucFDPSFBAeHkQ6AvttieKUkyJ8HiQGhQwe")

describe('Voting', () => {
  let context: any
  let provider: BankrunProvider
  let votingProgram: Program<Voting>
  let pollAddress: PublicKey
  let crunchyAddress: PublicKey
  let smoothAddress: PublicKey

  beforeAll(async () => {
    context = await startAnchor("", [{ name: "voting", programId: votingAddress }], [])
    provider = new BankrunProvider(context)
    votingProgram = new Program<Voting>(IDL, provider)

    ;[pollAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, 'le', 8)],
      votingAddress
    )

    ;[crunchyAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, 'le', 8), Buffer.from("Crunchy")],
      votingAddress
    )

    ;[smoothAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, 'le', 8), Buffer.from("Smooth")],
      votingAddress
    )
  })

  it('Initialize Poll', async () => {
    await votingProgram.methods.initializePoll(
      new anchor.BN(1),
      "What's your favorite type of peanut butter?",
      new anchor.BN(0),
      new anchor.BN(1859412061),
    ).accounts({
      poll: pollAddress,
      signer: provider.wallet.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId,
    }).rpc()

    const poll = await votingProgram.account.poll.fetch(pollAddress)
    console.log("Poll:", poll)
    expect(poll.pollId.toNumber()).toEqual(1)
  })

  it("Initialize Candidates", async () => {
    await votingProgram.methods.initializeCandidate(
      new anchor.BN(1),
      "Smooth",
    ).accounts({
      poll: pollAddress,
      candidate: smoothAddress,
      signer: provider.wallet.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId,
    }).rpc()

    await votingProgram.methods.initializeCandidate(
      new anchor.BN(1),
      "Crunchy",
    ).accounts({
      poll: pollAddress,
      candidate: crunchyAddress,
      signer: provider.wallet.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId,
    }).rpc()

    const crunchy = await votingProgram.account.candidate.fetch(crunchyAddress)
    console.log("Crunchy:", crunchy)
    expect(crunchy.candidateVotes.toNumber()).toEqual(0)
  })

  it("Vote for Crunchy", async () => {
    await votingProgram.methods.vote("Crunchy", new anchor.BN(1)).accounts({
      signer: provider.wallet.publicKey,
      poll: pollAddress,
      candidate: crunchyAddress,
    }).rpc()

    const crunchy = await votingProgram.account.candidate.fetch(crunchyAddress)
    console.log("Crunchy after vote:", crunchy)
    expect(crunchy.candidateVotes.toNumber()).toEqual(1)
  })
})
