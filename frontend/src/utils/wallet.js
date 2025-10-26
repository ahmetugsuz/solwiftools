export const connectWallet = async () => {
    try {
        // Check if Phantom is installed
        const { solana } = window;

        if (!solana?.isPhantom) {
            throw new Error('Phantom wallet is not installed');
        }

        // Connect to wallet
        const response = await solana.connect();
        const publicKey = response.publicKey.toString();
        
        return {
            success: true,
            publicKey,
            message: 'Wallet connected successfully'
        };
    } catch (error) {
        return {
            success: false,
            message: error.message
        };
    }
}; 