
import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { MyProject } from '../target/types/my_project';
import { expect } from 'chai';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

describe('my_project', () => {
  // Configure the client to use the local cluster.
  // Assumes 'solana-test-validator' is running and Anchor.toml provider points to localhost.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.MyProject as Program<MyProject>;

  // Generate a new keypair for the counter account BEFORE tests run.
  const counterAccount = anchor.web3.Keypair.generate();

  console.log(`Using program ID: ${program.programId.toString()}`);
  console.log(`Using counter account: ${counterAccount.publicKey.toString()}`);
  console.log(`Using wallet: ${provider.wallet.publicKey.toString()}`);

  // Fund the counter account before running tests that initialize it.
  // This is needed because the `initialize` function creates the account (`init`)
  // and the `counterAccount` needs SOL to pay for rent.
  before(async () => {
    console.log(`Funding counter account ${counterAccount.publicKey.toString()}...`);
    try {
        // Request an airdrop of 1 SOL to the counter account's public key.
        const airdropSignature = await provider.connection.requestAirdrop(
          counterAccount.publicKey,
          1 * LAMPORTS_PER_SOL // 1 SOL
        );

        // Confirm the transaction
        const { blockhash, lastValidBlockHeight } = await provider.connection.getLatestBlockhash();
        await provider.connection.confirmTransaction({
          blockhash: blockhash,
          lastValidBlockHeight: lastValidBlockHeight,
          signature: airdropSignature,
        }, 'confirmed'); // Use 'confirmed' or 'finalized' as needed

        console.log(`Airdrop successful. Signature: ${airdropSignature}`);

        // Optional: Check balance
        const balance = await provider.connection.getBalance(counterAccount.publicKey);
        console.log(`Counter account balance: ${balance / LAMPORTS_PER_SOL} SOL`);
        if (balance < LAMPORTS_PER_SOL * 0.1) { // Check if balance is reasonable
            console.warn("Counter account balance might be too low after airdrop.");
        }

    } catch (error) {
        console.error("Airdrop failed:", error);
        // Optional: Fund the provider's wallet if it's potentially out of funds for the airdrop itself
        // This is less common for local testing but can be a fallback
        try {
            console.log(`Attempting to fund provider wallet ${provider.wallet.publicKey.toString()}...`);
            const providerAirdropSig = await provider.connection.requestAirdrop(
                provider.wallet.publicKey,
                2 * LAMPORTS_PER_SOL // Request 2 SOL for the provider wallet
            );
            const { blockhash, lastValidBlockHeight } = await provider.connection.getLatestBlockhash();
            await provider.connection.confirmTransaction({
              blockhash: blockhash,
              lastValidBlockHeight: lastValidBlockHeight,
              signature: providerAirdropSig,
            }, 'confirmed');
            console.log(`Provider wallet funded. Attempting counter airdrop again...`);
            // Retry airdrop to counter account
            const retryAirdropSignature = await provider.connection.requestAirdrop(
              counterAccount.publicKey,
              1 * LAMPORTS_PER_SOL
            );
             const { blockhash: retryBh, lastValidBlockHeight: retryLvbh } = await provider.connection.getLatestBlockhash();
             await provider.connection.confirmTransaction({
               blockhash: retryBh,
               lastValidBlockHeight: retryLvbh,
               signature: retryAirdropSignature,
             }, 'confirmed');
            console.log(`Retry airdrop successful. Signature: ${retryAirdropSignature}`);
        } catch (retryError) {
            console.error("Retry airdrop also failed:", retryError);
            throw new Error("Failed to fund counter account for rent."); // Fail tests if funding fails
        }
    }
  });

  it('Is initialized!', async () => {
    // Initialize the counter account.
    // The `counterAccount` needs to sign because it's being created (`init`) and pays rent from its balance.
    const tx = await program.methods
      .initialize()
      .accounts({
        counter: counterAccount.publicKey,
        user: provider.wallet.publicKey, // The 'user' (payer) is the provider's wallet
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([counterAccount]) // The new account being created must sign
      .rpc({ commitment: 'confirmed' }); // Wait for confirmation

    console.log("Initialize transaction signature", tx);

    // Fetch the created account state
    const account = await program.account.counter.fetch(counterAccount.publicKey);
    console.log("Initialized Counter State:", account);
    expect(account.count.toNumber()).to.equal(0, "Counter should be initialized to 0");
  });

  it('Increments the counter', async () => {
     // Ensure the account exists from the 'initialize' test before trying to fetch/increment.
     // Fetching here is optional if you trust the 'initialize' test ran, but good for verification.
     let account = await program.account.counter.fetch(counterAccount.publicKey);
     const initialCount = account.count.toNumber();
     console.log(`Counter before increment: ${initialCount}`);

    // Increment the counter.
    // No extra signers are needed here because we are modifying an existing account (`counter`)
    // owned by the program, and the `Increment` instruction doesn't require a specific user signer.
    const tx = await program.methods
      .increment()
      .accounts({
        counter: counterAccount.publicKey,
      })
      .rpc({ commitment: 'confirmed' }); // Wait for confirmation

    console.log("Increment transaction signature", tx);

    // Fetch the updated account state
    account = await program.account.counter.fetch(counterAccount.publicKey);
    console.log(`Counter after first increment: ${account.count.toNumber()}`);
    expect(account.count.toNumber()).to.equal(initialCount + 1, "Counter should have incremented by 1");

    // ---- Increment again ----
    const tx2 = await program.methods
      .increment()
      .accounts({
        counter: counterAccount.publicKey,
      })
      .rpc({ commitment: 'confirmed' }); // Wait for confirmation
    console.log("Second increment transaction signature", tx2);

     account = await program.account.counter.fetch(counterAccount.publicKey);
     console.log(`Counter after second increment: ${account.count.toNumber()}`);
     expect(account.count.toNumber()).to.equal(initialCount + 2, "Counter should have incremented by 2 in total");
  });

  // Example of adding funds to the provider's wallet if needed during a specific test
  // (Less common if validator starts with funds or if 'before' handles funding)
  it('Can airdrop to provider wallet if needed', async () => {
    const initialBalance = await provider.connection.getBalance(provider.wallet.publicKey);
    console.log(`Provider wallet balance before test airdrop: ${initialBalance / LAMPORTS_PER_SOL} SOL`);

    const airdropSignature = await provider.connection.requestAirdrop(
      provider.wallet.publicKey,
      2 * LAMPORTS_PER_SOL // Request 2 SOL
    );

     const { blockhash, lastValidBlockHeight } = await provider.connection.getLatestBlockhash();
     await provider.connection.confirmTransaction({
       blockhash: blockhash,
       lastValidBlockHeight: lastValidBlockHeight,
       signature: airdropSignature,
     }, 'confirmed');

    const finalBalance = await provider.connection.getBalance(provider.wallet.publicKey);
    console.log(`Provider wallet balance after test airdrop: ${finalBalance / LAMPORTS_PER_SOL} SOL`);
    expect(finalBalance).to.be.greaterThan(initialBalance, "Provider wallet balance should increase after airdrop");
  });

});

