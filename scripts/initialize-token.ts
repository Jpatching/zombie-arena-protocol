import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, createMint, getMint } from "@solana/spl-token";
import { ZombieArenaProtocol } from "../contracts/target/types/zombie_arena_protocol";
import fs from 'fs';

async function main() {
  // Configure the client
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  // Load the program
  const programId = new PublicKey("YOUR_PROGRAM_ID_HERE");
  const program = anchor.workspace.ZombieArenaProtocol as Program<ZombieArenaProtocol>;

  // Generate or load token mint keypair
  let tokenMint: Keypair;
  const tokenMintPath = './token-mint.json';
  
  if (fs.existsSync(tokenMintPath)) {
    const mintSecretKey = JSON.parse(fs.readFileSync(tokenMintPath, 'utf-8'));
    tokenMint = Keypair.fromSecretKey(new Uint8Array(mintSecretKey));
    console.log('Loaded existing token mint:', tokenMint.publicKey.toBase58());
  } else {
    tokenMint = Keypair.generate();
    fs.writeFileSync(tokenMintPath, JSON.stringify(Array.from(tokenMint.secretKey)));
    console.log('Generated new token mint:', tokenMint.publicKey.toBase58());
  }

  try {
    // Initialize token with 1 billion supply
    const decimals = 9;
    const initialSupply = new anchor.BN(1_000_000_000).mul(new anchor.BN(10 ** decimals));

    // Derive PDAs
    const [tokenData] = PublicKey.findProgramAddressSync(
      [Buffer.from("token_data"), tokenMint.publicKey.toBuffer()],
      program.programId
    );

    const [mintAuthority] = PublicKey.findProgramAddressSync(
      [Buffer.from("mint_authority"), tokenMint.publicKey.toBuffer()],
      program.programId
    );

    // Get admin token account
    const adminTokenAccount = await anchor.utils.token.associatedAddress({
      mint: tokenMint.publicKey,
      owner: provider.wallet.publicKey,
    });

    console.log('Initializing $ZAP token...');
    console.log('Token Mint:', tokenMint.publicKey.toBase58());
    console.log('Admin:', provider.wallet.publicKey.toBase58());
    console.log('Initial Supply:', initialSupply.toString());

    // Initialize token
    const tx = await program.methods
      .initializeToken(initialSupply, decimals)
      .accounts({
        admin: provider.wallet.publicKey,
        mint: tokenMint.publicKey,
        tokenData,
        mintAuthority,
        adminTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([tokenMint])
      .rpc();

    console.log('Token initialized successfully!');
    console.log('Transaction signature:', tx);
    
    // Save important addresses
    const config = {
      programId: program.programId.toBase58(),
      tokenMint: tokenMint.publicKey.toBase58(),
      tokenData: tokenData.toBase58(),
      mintAuthority: mintAuthority.toBase58(),
      adminTokenAccount: adminTokenAccount.toBase58(),
      decimals,
      initialSupply: initialSupply.toString(),
    };

    fs.writeFileSync('./zap-config.json', JSON.stringify(config, null, 2));
    console.log('Configuration saved to zap-config.json');

    // Verify token creation
    const mintInfo = await getMint(provider.connection, tokenMint.publicKey);
    console.log('\nToken verified:');
    console.log('Supply:', mintInfo.supply.toString());
    console.log('Decimals:', mintInfo.decimals);
    console.log('Mint Authority:', mintInfo.mintAuthority?.toBase58());

  } catch (error) {
    console.error('Error initializing token:', error);
    throw error;
  }
}

// Run the script
main()
  .then(() => {
    console.log('\n🎉 $ZAP token initialization complete!');
    console.log('\nNext steps:');
    console.log('1. Update .env files with the token mint address');
    console.log('2. Deploy the frontend and backend');
    console.log('3. Launch on Pump.fun');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });