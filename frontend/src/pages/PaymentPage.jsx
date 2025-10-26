import '../styles/PaymentPage.css';
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { IoArrowBack } from 'react-icons/io5';
import { BiCube } from 'react-icons/bi';
import { BsWallet2 } from 'react-icons/bs';
import { FiEye } from 'react-icons/fi';
import solanaQR from '../images/solana-qr.png';
import { Connection, Transaction, SystemProgram, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Buffer } from 'buffer';
import RadialGradient from '../components/RadialGradient';
import { useLicense } from '../hooks/useLicense';
import toast from 'react-hot-toast';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';

window.Buffer = Buffer;

const ProductCard = ({ name, price }) => (
    <div className="product-card">
        <div className="product-icon">
            <BiCube />
        </div>
        <div className="product-details">
            <h2>{name}</h2>
            <p className="price">{price}</p>
        </div>
    </div>
);

const OrderDetailsCard = ({ product }) => (
    <div className="order-details-card">
        <div className="detail-row">
            <span>{product?.name}</span>
            <span>{product?.price}</span>
        </div>
        <div className="detail-row">
            <span>Quantity</span>
            <span>1</span>
        </div>
        <div className="detail-row">
            <span>Subtotal</span>
            <span>{product?.price}</span>
        </div>
        <div className="detail-row total">
            <span>Total</span>
            <span>{product?.price}</span>
        </div>
    </div>
);

const TransactionDetailsCard = ({ product, solPrice }) => {
    // Calculate USDC value dynamically
    const getUsdcValue = () => {
        if (!solPrice) return "Loading...";
        const solAmount = parseFloat(product?.price || '0');
        const value = (solAmount * solPrice).toFixed(2);
        return `$${value} USDC`;
    };

    return (
        <div className="transaction-card">
            <h3>Transaction Details</h3>
            <div className="transaction-row">
                <span>Amount</span>
                <span>{product?.price}</span>
            </div>
            <div className="transaction-row">
                <span>Created</span>
                <span>{new Date().toLocaleString()}</span>
            </div>
            <div className="transaction-row">
                <span>{product?.price} USDC Value</span>
                <span>{getUsdcValue()}</span>
            </div>
        </div>
    );
};

const SolanaPayIcon = () => (
    <svg 
        fill="none" 
        viewBox="0 0 24 24" 
        width="32px" 
        height="32px" 
        strokeLinecap="round" 
        strokeLinejoin="round"
    >
        <path 
            fill="currentColor" 
            fillRule="evenodd" 
            d="M6.092 16.253a.62.62 0 0 1 .458-.203l14.14.012a.312.312 0 0 1 .306.36.31.31 0 0 1-.077.16l-3.011 3.315a.62.62 0 0 1-.459.203L3.31 20.09a.311.311 0 0 1-.229-.52zm14.827-2.76a.31.31 0 0 1-.23.52l-14.138.012a.62.62 0 0 1-.459-.203l-3.01-3.317a.31.31 0 0 1 .228-.52l14.14-.012a.62.62 0 0 1 .458.203zM6.092 4.103A.62.62 0 0 1 6.55 3.9l14.14.011a.311.311 0 0 1 .229.52l-3.011 3.316a.62.62 0 0 1-.459.203L3.31 7.938a.31.31 0 0 1-.229-.52z" 
            clipRule="evenodd"
        />
    </svg>
);

const requestAirdrop = async (connection, publicKey, toastId) => {
    try {
        toast.loading('Requesting airdrop...', { id: toastId });
        
        // Try multiple RPC endpoints if one fails
        const endpoints = [
            'https://api.devnet.solana.com',
            'https://devnet.solana.rpcpool.com',
            'https://api.testnet.solana.com'
        ];

        let success = false;
        let error = null;

        for (const endpoint of endpoints) {
            try {
                const tempConnection = new Connection(endpoint, 'confirmed');
                const airdropSignature = await tempConnection.requestAirdrop(
                    publicKey,
                    1 * LAMPORTS_PER_SOL // Request 1 SOL at a time
                );

                // Wait for confirmation
                const latestBlockhash = await tempConnection.getLatestBlockhash();
                await tempConnection.confirmTransaction({
                    signature: airdropSignature,
                    ...latestBlockhash
                });

                // Verify the balance increased
                const newBalance = await tempConnection.getBalance(publicKey);
                if (newBalance > 0) {
                    success = true;
                    break;
                }
            } catch (e) {
                console.log(`Airdrop failed for endpoint ${endpoint}:`, e);
                error = e;
            }
        }

        if (success) {
            toast.success('Airdrop successful! Please try payment again.', { id: toastId });
            return true;
        } else {
            throw error || new Error('All airdrop attempts failed');
        }
    } catch (error) {
        console.error('Airdrop failed:', error);
        toast.error('Airdrop failed. Please try getting SOL from a faucet instead.', { id: toastId });
        
        // Show faucet options
        const useFaucet = window.confirm('Would you like to visit a Solana faucet?');
        if (useFaucet) {
            window.open('https://solfaucet.com', '_blank');
        }
        return false;
    }
};

const WalletPaymentCard = ({ product, connectWallet, setWalletAddress }) => {
    const { createLicense } = useLicense(connectWallet, setWalletAddress);
    const [isProcessing, setIsProcessing] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { email } = location.state || {};

    const handleWalletPayment = async () => {
        if (isProcessing) return;
        setIsProcessing(true);
        const toastId = toast.loading('Initializing payment...');

        try {
            // Check if Phantom Wallet is installed
            if (!window.solana || !window.solana.isPhantom) {
                toast.error("Please install Phantom Wallet!", { id: toastId });
                window.open("https://phantom.app/", "_blank");
                return;
            }

            // Connect to wallet if not connected
            if (!window.solana.isConnected) {
                await window.solana.connect();
            }

            const response = await window.solana.connect();
            const publicKey = response.publicKey;

            // Create connection to Solana network
            const connection = new Connection(
                'https://maximum-falling-leaf.solana-mainnet.quiknode.pro/f8542a105543937e8a2a44ae2cd850a1cd2ee6cc/', // Using QuickNode mainnet URL
                'confirmed'
            );

            // Removed balance check and faucet prompt. Always proceed to transaction.
            const amount = parseFloat(product?.price || '0');
            const requiredLamports = amount * LAMPORTS_PER_SOL;

            toast.loading('Processing payment...', { id: toastId });

            // Create the transaction
            const recipientAddress = "2vd5ru6SiwSzixfEfgyZ6HJ2HMCw9EoaJGDXWqMYQhGX";
            
            const transaction = new Transaction().add(
                SystemProgram.transfer({
                    fromPubkey: publicKey,
                    toPubkey: new PublicKey(recipientAddress),
                    lamports: requiredLamports,
                })
            );

            // Get the latest blockhash
            const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = publicKey;

            try {
                // Sign and send the transaction
                const signed = await window.solana.signTransaction(transaction);
                const signature = await connection.sendRawTransaction(signed.serialize());
                
                // Wait for confirmation with timeout
                const confirmation = await connection.confirmTransaction({
                    signature,
                    blockhash,
                    lastValidBlockHeight
                });

                if (confirmation?.value?.err) {
                    throw new Error('Transaction failed to confirm');
                }

                // Create license after successful payment
                const licenseType = product.name.includes('Lifetime') ? 'LIFETIME' : 'RENTAL';
                await createLicense({
                    type: licenseType,
                    walletAddress: publicKey.toString(),
                    transactionHash: signature,
                    email
                });

                toast.success('Payment successful! License created.', { id: toastId });
                navigate('/dashboard');

            } catch (txError) {
                console.error('Transaction error:', txError);
                let errorMessage = 'Transaction failed';

                // Custom error for insufficient funds
                const txErrorString = JSON.stringify(txError).toLowerCase();
                if (
                    txErrorString.includes('e11000') && txErrorString.includes('licenseid')
                ) {
                    errorMessage = 'You already own this license.';
                } else if (
                    txErrorString.includes('insufficient') ||
                    txErrorString.includes('not enough sol') ||
                    txErrorString.includes('custom program error: 0x1')
                ) {
                    errorMessage = 'You do not have enough SOL to complete this payment. Please fund your wallet and try again.';
                } else if (txError.logs) {
                    errorMessage += ': ' + txError.logs.join('\n');
                }

                toast.error(errorMessage, { id: toastId });
            }

        } catch (error) {
            console.error('Error:', error);
            toast.error(error.message || 'An error occurred', { id: toastId });
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="wallet-payment-card">
            <button 
                className={`wallet-button ${isProcessing ? 'processing' : ''}`}
                onClick={handleWalletPayment}
                disabled={isProcessing}
            >
                <div className="button-content pay-with-wallet-btn">
                    <BsWallet2 className="wallet-icon" />
                    <span>{isProcessing ? 'Processing...' : 'Pay With Wallet'}</span>
                </div>
                <span className="arrow">›</span>
            </button>
        </div>
    );
};

const QRCodePaymentCard = () => {
    const [isExpanded, setIsExpanded] = useState(true);
    const [isQRRevealed, setIsQRRevealed] = useState(false);

    return (
        <div className="qr-payment-card">
            <button 
                className="qr-button"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="button-content">
                    <div className="solana-pay-icon">
                        <SolanaPayIcon />
                    </div>
                    <span>Pay via QR Code</span>
                </div>
                <span className={`arrow ${isExpanded ? 'expanded' : ''}`}>›</span>
            </button>

            {isExpanded && (
                <div className="qr-content">
                    <div className="solana-pay">
                        <div className="solana-pay-icon">
                            <SolanaPayIcon />
                        </div>
                        <div className="solana-text">
                            <h4>Solana Pay</h4>
                            <p>Scan to complete payment</p>
                        </div>
                    </div>

                    <div className="qr-code-container">
                        {isQRRevealed ? (
                            <img 
                                src={solanaQR} 
                                alt="Solana Pay QR Code" 
                                className="qr-code"
                            />
                        ) : (
                            <div className="qr-placeholder">
                                <BiCube />
                                <span>QR Code Protected</span>
                            </div>
                        )}
                    </div>

                    <button 
                        className="reveal-button"
                        onClick={() => setIsQRRevealed(true)}
                    >
                        <FiEye />
                        Reveal QR Code
                    </button>

                    <p className="scan-instruction">
                        Scan this QR code with your Solana wallet<br />
                        to complete the payment
                    </p>

                    <button className="verify-button">
                        Verify Payment
                    </button>
                </div>
            )}
        </div>
    );
};

const PaymentPage = (connectWallet, setWalletAddress) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { product, email } = location.state || {};
    const [solPrice, setSolPrice] = useState(null);
    
    // Function to fetch the latest SOL price
    const fetchSolPrice = async () => {
        try {
            console.log("Fetching SOL price..."); // Debug log
            const response = await fetch(
                'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd'
            );
            const data = await response.json();
            
            if (data && data.solana && data.solana.usd) {
                const price = data.solana.usd;
                console.log("Updated SOL price:", price); // Debug log
                setSolPrice(price);
            }
        } catch (error) {
            console.error('Error fetching SOL price:', error);
        }
    };
    
    // Fetch price on component mount and every 5 minutes
    useEffect(() => {
        fetchSolPrice(); // Initial fetch
        
        const interval = setInterval(() => {
            fetchSolPrice();
        }, 300000); // Every 5 minutes (300000 ms)
        
        return () => clearInterval(interval);
    }, []);

    if (!product) {
        navigate('/products');
        return null;
    }

    return (
        <div className="payment-page">
            <RadialGradient />
            <div className="container">
                <button className="back-button" onClick={() => navigate(-1)}>
                    <svg 
                        stroke="currentColor" 
                        fill="currentColor" 
                        strokeWidth="0" 
                        viewBox="0 0 512 512" 
                        height="1em" 
                        width="1em" 
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path 
                            fill="none" 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth="48" 
                            d="M244 400 100 256l144-144M120 256h292"
                        />
                    </svg>
                </button>

                <div className="main-content">
                    <div className="left-panel">
                        <ProductCard name={product?.name} price={product?.price} />
                        <OrderDetailsCard product={product} />
                        <TransactionDetailsCard product={product} solPrice={solPrice} />
                    </div>

                    <div className="right-panel">
                        <h2>Choose Payment Method</h2>
                        <span className="status">Awaiting Payment</span>
                        <WalletPaymentCard 
                        product={product}
                        connectWallet={connectWallet}
                        setWalletAddress={setWalletAddress} />
                        <QRCodePaymentCard />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentPage; 