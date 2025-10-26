export const connectPhantomWallet = async () => {
    if (window.solana && window.solana.isPhantom) {
        try {
            const response = await window.solana.connect();
            console.log("Connected Wallet Address:", response.publicKey.toString());
            return response.publicKey.toString();
        } catch (error) {
            console.error("Error connecting Phantom wallet:", error);
            return null;
        }
    } else {
        alert("Please install the Phantom wallet extension.");
        return null;
    }
};
