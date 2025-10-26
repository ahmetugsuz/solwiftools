import { 
    Connection, 
    clusterApiUrl, 
    PublicKey, 
    Keypair,
    Transaction,
    SystemProgram,
    LAMPORTS_PER_SOL
} from "@solana/web3.js";
import { 
    Token, 
    TOKEN_PROGRAM_ID, 
    ASSOCIATED_TOKEN_PROGRAM_ID 
} from "@solana/spl-token";

class TokenService {
    constructor() {
        // Initialize connection to Solana network (devnet for testing)
        this.connection = new Connection(process.env.SOLANA_RPC_URL || 'https://maximum-falling-leaf.solana-mainnet.quiknode.pro/f8542a105543937e8a2a44ae2cd850a1cd2ee6cc/', 'confirmed');
    }

    async createToken(payerPublicKey, tokenDetails) {
        try {
            // Generate new keypair for the token mint
            const mintKeypair = Keypair.generate();
            
            // Create the token with specified parameters
            const token = await Token.createMint(
                this.connection,
                payerPublicKey,  // Payer
                payerPublicKey,  // Mint authority
                null,            // Freeze authority (null = no freeze)
                tokenDetails.decimals || 9,  // Decimals
                TOKEN_PROGRAM_ID
            );

            // Get or create associated token account for the payer
            const associatedTokenAccount = await token.getOrCreateAssociatedAccountInfo(
                payerPublicKey
            );

            // Mint initial supply to the creator's wallet
            if (tokenDetails.initialSupply) {
                await token.mintTo(
                    associatedTokenAccount.address,
                    payerPublicKey,
                    [],
                    tokenDetails.initialSupply
                );
            }

            // Optionally disable future minting
            if (tokenDetails.fixedSupply) {
                await token.setAuthority(
                    token.publicKey,
                    null,
                    'MintTokens',
                    payerPublicKey,
                    []
                );
            }

            return {
                tokenMint: token.publicKey.toString(),
                associatedTokenAccount: associatedTokenAccount.address.toString()
            };

        } catch (error) {
            console.error('Error creating token:', error);
            throw new Error('Failed to create token');
        }
    }

    async burnTokens(mintAddress, ownerPublicKey, amount) {
        try {
            const token = new Token(
                this.connection,
                new PublicKey(mintAddress),
                TOKEN_PROGRAM_ID,
                ownerPublicKey
            );

            const account = await token.getOrCreateAssociatedAccountInfo(ownerPublicKey);
            await token.burn(account.address, ownerPublicKey, [], amount);

            return true;
        } catch (error) {
            console.error('Error burning tokens:', error);
            throw new Error('Failed to burn tokens');
        }
    }
}

export default new TokenService(); 