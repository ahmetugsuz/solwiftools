const { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const { createInitializeMintInstruction, createAssociatedTokenAccountInstruction, getAssociatedTokenAddress, createMintToInstruction, TOKEN_PROGRAM_ID, MINT_SIZE, ASSOCIATED_TOKEN_PROGRAM_ID } = require('@solana/spl-token');
const BASE_COST = 0.0002;
const ADDON_COST = 0.001;

function calculateTokenCreationCost(addOns) {
    // Base cost for token creation (0.01 SOL)
    let totalCost = BASE_COST;
    
    // Add 0.01 SOL for each additional feature
    if (Array.isArray(addOns)) {
        // Calculate total cost including add-ons
        const addOnCost = addOns.length * ADDON_COST;
        totalCost += addOnCost;

        // Log the calculation for debugging
        console.log('Add-ons:', addOns);
        console.log('Add-on cost:', addOnCost);
        console.log('Total cost in SOL:', totalCost);
    }
    
    // Convert to lamports (1 SOL = 1,000,000,000 lamports)
    const lamports = Math.floor(totalCost * LAMPORTS_PER_SOL);
    console.log('Total cost in lamports:', lamports);
    
    return lamports;
}

async function handleTokenCreationPayment(connection, userWallet, addOns) {
    try {
        const serviceWallet = new PublicKey('2vd5ru6SiwSzixfEfgyZ6HJ2HMCw9EoaJGDXWqMYQhGX');
        
        // Calculate service fee (base cost + add-ons)
        let serviceFee = BASE_COST; // Base cost in SOL
        if (Array.isArray(addOns)) {
            const addOnCost = addOns.length * ADDON_COST;
            serviceFee += addOnCost;
            console.log('Add-ons count:', addOns.length);
            console.log('Add-on cost in SOL:', addOnCost);
        }

        // Get the minimum rent for token creation
        const rentExemptionFee = await connection.getMinimumBalanceForRentExemption(82);
        
        // Convert service fee to lamports and add rent exemption
        const serviceFeeInLamports = Math.floor(serviceFee * LAMPORTS_PER_SOL);
        const totalLamports = serviceFeeInLamports + rentExemptionFee;

        console.log('Service fee (SOL):', serviceFee);
        console.log('Service fee (lamports):', serviceFeeInLamports);
        console.log('Rent exemption (lamports):', rentExemptionFee);
        console.log('Total cost (lamports):', totalLamports);
        console.log('Total cost (SOL):', totalLamports / LAMPORTS_PER_SOL);

        const transaction = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: new PublicKey(userWallet),
                toPubkey: serviceWallet,
                lamports: totalLamports,
            })
        );

        const { blockhash } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = new PublicKey(userWallet);

        return transaction;
    } catch (error) {
        console.error('Payment handling error:', error);
        throw error;
    }
}

// Example usage
async function createTokenWithPayment(
    connection,
    userWallet,
    serviceWallet,
    addOns
) {
    try {
        // First handle the payment
        const paymentTransaction = await handleTokenCreationPayment(
            connection,
            userWallet,
            addOns
        );

        return paymentTransaction;
    } catch (error) {
        console.error('Error during token creation payment:', error);
        throw error;
    }
}

// Add this new method to handle the complete payment and token creation flow
async function processTokenCreationWithPayment(
    connection,
    userWallet,
    mintKeypair,
    addOns,
    tokenDetails
) {
    try {
        const serviceWallet = new PublicKey('2vd5ru6SiwSzixfEfgyZ6HJ2HMCw9EoaJGDXWqMYQhGX');
        const userPublicKey = new PublicKey(userWallet);
        
        console.log('Processing token creation with details:', {
            userWallet,
            mintAddress: mintKeypair.publicKey.toString(),
            tokenDetails
        });

        // Calculate fees
        let serviceFee = BASE_COST;
        if (Array.isArray(addOns)) {
            serviceFee += (addOns.length * ADDON_COST);
        }

        const mintRent = await connection.getMinimumBalanceForRentExemption(MINT_SIZE);
        const serviceFeeInLamports = Math.floor(serviceFee * LAMPORTS_PER_SOL);

        // Get the ATA for the user
        const associatedTokenAccount = await getAssociatedTokenAddress(
            mintKeypair.publicKey,
            userPublicKey
        );

        console.log('Created ATA:', associatedTokenAccount.toString());

        // Create two separate transactions
        const paymentTransaction = new Transaction();
        const tokenCreationTransaction = new Transaction();

        // Add payment instruction
        paymentTransaction.add(
            SystemProgram.transfer({
                fromPubkey: userPublicKey,
                toPubkey: serviceWallet,
                lamports: serviceFeeInLamports,
            })
        );

        // Add token creation instructions
        tokenCreationTransaction.add(
            // 1. Create mint account
            SystemProgram.createAccount({
                fromPubkey: userPublicKey,
                newAccountPubkey: mintKeypair.publicKey,
                space: MINT_SIZE,
                lamports: mintRent,
                programId: TOKEN_PROGRAM_ID
            }),
            // 2. Initialize mint
            createInitializeMintInstruction(
                mintKeypair.publicKey,
                tokenDetails?.decimals || 9,
                userPublicKey,
                userPublicKey
            ),
            // 3. Create ATA
            createAssociatedTokenAccountInstruction(
                userPublicKey,
                associatedTokenAccount,
                userPublicKey,
                mintKeypair.publicKey
            )
        );

        // Add mint instruction if supply is specified
        if (tokenDetails?.initialSupply) {
            const supply = tokenDetails.initialSupply * Math.pow(10, tokenDetails.decimals || 9);
            console.log('Minting initial supply:', supply);
            
            tokenCreationTransaction.add(
                createMintToInstruction(
                    mintKeypair.publicKey,
                    associatedTokenAccount,
                    userPublicKey,
                    supply
                )
            );
        }

        // Get blockhash for both transactions
        const { blockhash } = await connection.getLatestBlockhash();
        
        // Set blockhash and fee payer for payment transaction only
        paymentTransaction.recentBlockhash = blockhash;
        paymentTransaction.feePayer = userPublicKey;
        
        // Set a temporary blockhash and fee payer for partial signing (required by Solana)
        const { blockhash: tempBlockhash } = await connection.getLatestBlockhash();
        tokenCreationTransaction.recentBlockhash = tempBlockhash;
        tokenCreationTransaction.feePayer = userPublicKey; // Set temp fee payer for partialSign
        tokenCreationTransaction.partialSign(mintKeypair);
        // The frontend will overwrite feePayer and blockhash before signing and sending

        console.log('Transactions created successfully');
        return {
            paymentTransaction: paymentTransaction.serialize({ requireAllSignatures: false }).toString('base64'),
            tokenCreationTransaction: tokenCreationTransaction.serialize({ requireAllSignatures: false }).toString('base64')
        };

    } catch (error) {
        console.error('Error in processTokenCreationWithPayment:', error);
        throw error;
    }
}

module.exports = {
    calculateTokenCreationCost,
    handleTokenCreationPayment,
    processTokenCreationWithPayment
};
