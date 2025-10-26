const { 
    Connection, 
    PublicKey,
    Keypair,
    SystemProgram,
    LAMPORTS_PER_SOL,
    Transaction
} = require('@solana/web3.js');
const { 
    createInitializeMintInstruction,
    getMinimumBalanceForRentExemption,
    MINT_SIZE,
    TOKEN_PROGRAM_ID,
    getMint,
    createMintToInstruction,
    getOrCreateAssociatedTokenAccount,
    createFreezeAccountInstruction,
    createThawAccountInstruction
} = require('@solana/spl-token');
const dotenv = require('dotenv');

dotenv.config();

class SolanaService {
    constructor() {
        this.connection = new Connection(process.env.SOLANA_RPC_URL || 'https://maximum-falling-leaf.solana-mainnet.quiknode.pro/f8542a105543937e8a2a44ae2cd850a1cd2ee6cc/', 'confirmed');
    }

    async createToken(payerPublicKey, tokenDetails) {
        try {
            console.log('Creating token with details:', {
                payer: payerPublicKey,
                details: tokenDetails
            });
            
            const payerPubkey = new PublicKey(payerPublicKey);
            const mintKeypair = Keypair.generate();

            console.log('Generated mint keypair:', mintKeypair.publicKey.toString());

            // Get the minimum lamports required
            const lamports = await this.connection.getMinimumBalanceForRentExemption(MINT_SIZE);

            // Create the token mint account
            const createAccountInstruction = SystemProgram.createAccount({
                fromPubkey: payerPubkey,
                newAccountPubkey: mintKeypair.publicKey,
                space: MINT_SIZE,
                lamports,
                programId: TOKEN_PROGRAM_ID
            });

            // Initialize the mint instruction
            const initializeMintInstruction = createInitializeMintInstruction(
                mintKeypair.publicKey,
                tokenDetails.decimals || 9,
                payerPubkey,
                payerPubkey
            );

            // Create transaction
            const transaction = new Transaction();
            transaction.add(createAccountInstruction);
            transaction.add(initializeMintInstruction);

            // Get the latest blockhash
            const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash();
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = payerPubkey;

            console.log('Transaction created successfully');

            const signature = await this.connection.sendTransaction(transaction, [payerPubkey]);

            const associatedTokenAccount = await getOrCreateAssociatedTokenAccount(
                this.connection,
                payerPubkey,
                mintKeypair.publicKey,
                payerPubkey
            );

            return {
                success: true,
                mintAddress: mintKeypair.publicKey.toString(),
                mintKeypair: {
                    publicKey: mintKeypair.publicKey.toString(),
                    secretKey: Array.from(mintKeypair.secretKey)
                },
                associatedTokenAccount: associatedTokenAccount.toString(),
                signature: signature,
                lastValidBlockHeight
            };

        } catch (error) {
            console.error('Error in createToken:', error);
            throw error;
        }
    }

    async getTokenInfo(mintAddress) {
        try {
            const mintPublicKey = new PublicKey(mintAddress);
            
            // First check if the account exists
            const accountInfo = await this.connection.getAccountInfo(mintPublicKey);
            if (!accountInfo) {
                return {
                    exists: false,
                    supply: '0',
                    decimals: 0,
                    isFrozen: false
                };
            }

            try {
                const mintInfo = await getMint(
                    this.connection,
                    mintPublicKey
                );

                return {
                    exists: true,
                    supply: mintInfo.supply.toString(),
                    decimals: mintInfo.decimals,
                    isFrozen: mintInfo.freezeAuthority !== null,
                    mintAuthority: mintInfo.mintAuthority?.toString(),
                    freezeAuthority: mintInfo.freezeAuthority?.toString()
                };
            } catch (error) {
                console.log('Error getting mint info:', error);
                return {
                    exists: false,
                    supply: '0',
                    decimals: 0,
                    isFrozen: false,
                    error: error.message
                };
            }
        } catch (error) {
            console.error('Error getting token info:', error);
            throw new Error(`Failed to get token info: ${error.message}`);
        }
    }

    async mintTokens(mintAddress, amount, walletAddress) {
        try {
            const mintPubkey = new PublicKey(mintAddress);
            const payerPubkey = new PublicKey(walletAddress);

            // Get the token account
            const tokenAccount = await getOrCreateAssociatedTokenAccount(
                this.connection,
                payerPubkey,
                mintPubkey,
                payerPubkey
            );

            // Create mint instruction
            const mintInstruction = createMintToInstruction(
                mintPubkey,
                tokenAccount.address,
                payerPubkey,
                amount * (10 ** 9), // Adjust for decimals
                [],
                TOKEN_PROGRAM_ID
            );

            // Create transaction
            const transaction = new Transaction().add(mintInstruction);
            
            // Get the latest blockhash
            const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash();
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = payerPubkey;

            return {
                success: true,
                transaction: transaction.serialize({
                    requireAllSignatures: false,
                    verifySignatures: false
                }).toString('base64'),
                lastValidBlockHeight
            };

        } catch (error) {
            console.error('Error minting tokens:', error);
            throw new Error(`Failed to mint tokens: ${error.message}`);
        }
    }

    async freezeToken(mintAddress, walletAddress) {
        try {
            const mintPubkey = new PublicKey(mintAddress);
            const payerPubkey = new PublicKey(walletAddress);

            // Get the token account
            const tokenAccount = await getOrCreateAssociatedTokenAccount(
                this.connection,
                payerPubkey,
                mintPubkey,
                payerPubkey
            );

            // Check if already frozen
            const mintInfo = await getMint(this.connection, mintPubkey);
            const isFrozen = mintInfo.freezeAuthority !== null;

            // Create freeze/thaw instruction based on current state
            const instruction = isFrozen
                ? createThawAccountInstruction(
                    mintPubkey,
                    tokenAccount.address,
                    payerPubkey,
                    [],
                    TOKEN_PROGRAM_ID
                )
                : createFreezeAccountInstruction(
                    mintPubkey,
                    tokenAccount.address,
                    payerPubkey,
                    [],
                    TOKEN_PROGRAM_ID
                );

            // Create transaction
            const transaction = new Transaction().add(instruction);
            
            // Get the latest blockhash
            const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash();
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = payerPubkey;

            return {
                success: true,
                transaction: transaction.serialize({
                    requireAllSignatures: false,
                    verifySignatures: false
                }).toString('base64'),
                lastValidBlockHeight,
                isFrozen: !isFrozen // Return the new state
            };

        } catch (error) {
            console.error('Error freezing token:', error);
            throw new Error(`Failed to freeze token: ${error.message}`);
        }
    }

    // Helper method to get token balance
    async getTokenBalance(mintAddress, walletAddress) {
        try {
            const mintPubkey = new PublicKey(mintAddress);
            const payerPubkey = new PublicKey(walletAddress);

            const tokenAccount = await getOrCreateAssociatedTokenAccount(
                this.connection,
                payerPubkey,
                mintPubkey,
                payerPubkey
            );

            const balance = await this.connection.getTokenAccountBalance(tokenAccount.address);
            return balance.value.uiAmount;
        } catch (error) {
            console.error('Error getting token balance:', error);
            throw new Error(`Failed to get token balance: ${error.message}`);
        }
    }
}

module.exports = new SolanaService(); 