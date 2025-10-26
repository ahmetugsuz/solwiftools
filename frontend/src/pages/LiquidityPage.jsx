import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/LiquidityPage.css';
import { LiquidityService } from '../services/liquidityService';
import toast from 'react-hot-toast';
import { useWallet } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL, Connection, PublicKey } from '@solana/web3.js';
import useTokenStore from '../store/tokenStore';
import axios from 'axios';

// Add the formatSolAmount helper function here
const formatSolAmount = (lamports) => {
    if (!lamports) return '0.000000000';
    return (lamports / LAMPORTS_PER_SOL).toFixed(9);
};

// Helper to check if a pool exists for a token
const checkPoolExists = async (tokenMintAddress) => {
    try {
        const res = await axios.get(`/api/liquidity/pool/${tokenMintAddress}`);
        return res.data && res.data.exists;
    } catch (err) {
        return false;
    }
};

const LiquidityPage = () => {
    const { 
        tokens, 
        setTokens, 
        loading, 
        setLoading,
        error,
        setError 
    } = useTokenStore();

    const [launchDateEnabled, setLaunchDateEnabled] = useState(false);
    const [activeTab, setActiveTab] = useState('add'); // 'add' or 'remove'
    const [userTokens, setUserTokens] = useState([]);
    const [selectedToken, setSelectedToken] = useState(null);
    const [selectedQuoteToken, setSelectedQuoteToken] = useState(null);
    const [solAmount, setSolAmount] = useState('');
    const [tokenAmount, setTokenAmount] = useState('');
    const [solBalance, setSolBalance] = useState(0);
    const [tokenBalance, setTokenBalance] = useState(0);
    const [poolStats, setPoolStats] = useState({
        totalSol: 0,
        totalTokens: 0,
        userShare: 0
    });
    const wallet = useWallet();
    const [liquidityService, setLiquidityService] = useState(null);

    // Initialize states from localStorage
    const [isWalletConnected, setIsWalletConnected] = useState(() => {
        return !!localStorage.getItem('walletAddress');
    });
    const [walletAddress, setWalletAddress] = useState(() => {
        return localStorage.getItem('walletAddress') || null;
    });

    const [isRefreshing, setIsRefreshing] = useState(false);

    // Add class to body for liquidity page
    useEffect(() => {
        document.body.classList.add('liquidity-page');
        
        return () => {
            document.body.classList.remove('liquidity-page');
        };
    }, []);

    useEffect(() => {
        if (wallet) {
            try {
                const service = new LiquidityService(wallet);
                setLiquidityService(service);
            } catch (error) {
                console.error('Failed to initialize LiquidityService:', error);
            }
        }
    }, [wallet]);

    // Available quote tokens (only SOL for now)
    const quoteTokens = [
        { symbol: 'SOL', name: 'Solana', address: 'native' }
        // Add more tokens later:
        // { symbol: 'ETH', name: 'Ethereum', address: 'eth_address' },
        // { symbol: 'TRX', name: 'Tron', address: 'trx_address' },
    ];

    // Add wallet connection effect
    useEffect(() => {
        const checkWalletConnection = async () => {
            const storedAddress = localStorage.getItem('walletAddress');
            if (storedAddress && window.solana && window.solana.isPhantom) {
                try {
                    const response = await window.solana.connect({ onlyIfTrusted: true });
                    setIsWalletConnected(true);
                    setWalletAddress(response.publicKey.toString());
                } catch (error) {
                    console.error('Wallet reconnection error:', error);
                    localStorage.removeItem('walletAddress');
                    setIsWalletConnected(false);
                    setWalletAddress(null);
                }
            }
        };

        checkWalletConnection();

        const handleWalletConnection = (event) => {
            setIsWalletConnected(true);
            setWalletAddress(event.detail.address);
        };

        const handleWalletDisconnection = () => {
            setIsWalletConnected(false);
            setWalletAddress(null);
            setTokens([]); // Clear tokens on disconnect
        };

        window.addEventListener('walletConnected', handleWalletConnection);
        window.addEventListener('walletDisconnected', handleWalletDisconnection);

        return () => {
            window.removeEventListener('walletConnected', handleWalletConnection);
            window.removeEventListener('walletDisconnected', handleWalletDisconnection);
        };
    }, []);

    // Update the useEffect for fetching token balances
    useEffect(() => {
        const fetchBalances = async () => {
            if (isWalletConnected && walletAddress) {
                // Fetch SOL balance
                try {
                    const connection = new Connection('https://maximum-falling-leaf.solana-mainnet.quiknode.pro/f8542a105543937e8a2a44ae2cd850a1cd2ee6cc/');
                    const publicKey = new PublicKey(walletAddress);
                    const balance = await connection.getBalance(publicKey);
                    setSolBalance(balance / LAMPORTS_PER_SOL);
                } catch (error) {
                    console.error('Error fetching SOL balance:', error);
                }

                // Fetch token balance if a token is selected
                if (selectedToken) {
                    try {
                        const tokenBalance = await liquidityService.getTokenBalance(
                            selectedToken.tokenMintAddress,
                            walletAddress
                        );
                        setTokenBalance(tokenBalance);
                    } catch (error) {
                        console.error('Error fetching token balance:', error);
                    }
                }
            }
        };

        fetchBalances();
    }, [isWalletConnected, walletAddress, selectedToken, liquidityService]);

    // Combined refresh function that handles all data updates
    const refreshAllData = async () => {
        if (!isWalletConnected || !walletAddress || isRefreshing) return;
        
        setIsRefreshing(true);
        try {
            // Fetch tokens
            const response = await axios.get(`/api/tokens/user/${walletAddress}`);
            if (response.data.success) {
                setTokens(response.data.tokens.map(token => ({
                    ...token,
                    isValid: true
                })));
            }

            // Refresh SOL balance
            const connection = new Connection('https://maximum-falling-leaf.solana-mainnet.quiknode.pro/f8542a105543937e8a2a44ae2cd850a1cd2ee6cc/');
            const publicKey = new PublicKey(walletAddress);
            const newSolBalance = await connection.getBalance(publicKey);
            setSolBalance(newSolBalance / LAMPORTS_PER_SOL);

            // Refresh token balance and pool stats if token is selected
            if (selectedToken && liquidityService) {
                const newTokenBalance = await liquidityService.getTokenBalance(
                    selectedToken.tokenMintAddress,
                    walletAddress
                );
                setTokenBalance(newTokenBalance);

                const stats = await liquidityService.getPoolStats(selectedToken);
                setPoolStats(stats);
            }
        } catch (error) {
            console.error('Error refreshing data:', error);
        } finally {
            setIsRefreshing(false);
        }
    };

    // Single useEffect for periodic refresh
    useEffect(() => {
        if (isWalletConnected && walletAddress) {
            refreshAllData(); // Initial refresh
            const interval = setInterval(refreshAllData, 10000); // Refresh every 10 seconds
            return () => clearInterval(interval);
        }
    }, [isWalletConnected, walletAddress, selectedToken, liquidityService]);

    const calculateTokenPrice = () => {
        if (!solAmount || !tokenAmount) return 0;
        return Number(solAmount) / Number(tokenAmount);
    };

    const handleCreatePool = async () => {
        if (!isWalletConnected || !walletAddress) {
            toast.error('Please connect your wallet');
            return;
        }

        if (!selectedToken || !selectedQuoteToken || !solAmount || !tokenAmount) {
            toast.error('Please fill in all fields, including selecting a quote token.');
            return;
        }

        // 1. Pre-check if pool exists
        const poolExists = await checkPoolExists(selectedToken.tokenMintAddress);
        if (poolExists) {
            toast.error('A liquidity pool for this token already exists. You can add or remove liquidity from the existing pool.');
            return;
        }

        const toastId = toast.loading('Creating liquidity pool...');

        try {
            const result = await liquidityService.createPool({
                baseToken: selectedToken,
                quoteToken: selectedQuoteToken,
                solAmount: parseFloat(solAmount) * LAMPORTS_PER_SOL,
                tokenAmount: parseFloat(tokenAmount),
                publicKey: walletAddress
            });

            // Wait for transaction confirmation
            toast.loading('Waiting for transaction confirmation...', { id: toastId });
            await new Promise(resolve => setTimeout(resolve, 5050));

            // Single refresh after pool creation
            await refreshAllData();

            toast.success('Pool created successfully!', { id: toastId });
            setSolAmount('');
            setTokenAmount('');
        } catch (error) {
            console.error('Pool creation error:', error);
            toast.error(error.message || 'Failed to create pool', { id: toastId });
        }
    };

    // Update token selection handler
    const handleTokenSelection = async (tokenMintAddress) => {
        const token = tokens.find(t => t.tokenMintAddress === tokenMintAddress && t.isValid);
        if (token) {
            setSelectedToken(token);
            if (isWalletConnected && walletAddress && liquidityService) {
                try {
                    const balance = await liquidityService.getTokenBalance(
                        tokenMintAddress,
                        walletAddress
                    );
                    setTokenBalance(balance);
                } catch (error) {
                    console.error('Error fetching token balance:', error);
                    setTokenBalance(0);
                }
            }
        } else {
            setSelectedToken(null);
            setTokenBalance(0);
        }
    };

    return (
        <div className="min-h-screen">
            <div className="liquidity-container">
                <div className="liquidity-radial-bottom"></div>
                <div className="liquidity-card">
                <div className="liquidity-radial-top"></div>
                    <h1 className="card-title">Create Solana Liquidity Pool</h1>
                    <p className="card-subtitle">Easily create a Liquidity Pool for any Solana Token with ease.</p>

                    <div className="create-pool-section">
                        <h2 className="section-title">Create Liquidity Pool</h2>
                        <p className="section-subtitle">Create a Liquidity Pool from Raydium V3 CPMM Program</p>

                        <div className="token-inputs">
                            <div className="input-group">
                                <label className="input-label">Base Token<span>*</span></label>
                                <select 
                                    className="token-select"
                                    value={selectedToken?.tokenMintAddress || ''}
                                    onChange={(e) => handleTokenSelection(e.target.value)}
                                >
                                    <option value="">Choose Your Token</option>
                                    {tokens
                                        .filter(token => token.isValid)
                                        .map((token) => (
                                            <option 
                                                key={token.tokenMintAddress} 
                                                value={token.tokenMintAddress}
                                            >
                                                {token.name} ({token.symbol})
                                            </option>
                                        ))
                                    }
                                </select>
                            </div>
                            <div className="input-group">
                                <label className="input-label">Quote Token<span>*</span></label>
                                <select 
                                    className="token-select"
                                    value={selectedQuoteToken || ''}
                                    onChange={(e) => setSelectedQuoteToken(e.target.value)}
                                >
                                    <option value="">Choose Quote Token</option>
                                    {quoteTokens.map((token) => (
                                        <option key={token.address} value={token.address}>
                                            {token.symbol} - {token.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <h3 className="section-title">Add liquidity</h3>
                        <div className="liquidity-inputs">
                            <div className="input-group">
                                <input 
                                    type="number" 
                                    className="amount-input" 
                                    placeholder="Token amount" 
                                    value={tokenAmount}
                                    onChange={(e) => setTokenAmount(e.target.value)}
                                />
                                <p className="balance-text">
                                    Balance: {tokenBalance.toLocaleString()} {selectedToken ? userTokens.find(t => t.tokenMintAddress === selectedToken)?.symbol : 'tokens'}
                                </p>
                            </div>
                            <div className="input-group">
                                <input 
                                    type="number" 
                                    className="amount-input" 
                                    placeholder="SOL amount" 
                                    value={solAmount}
                                    onChange={(e) => setSolAmount(e.target.value)}
                                />
                                <p className="balance-text">
                                    Balance: {solBalance.toLocaleString()} SOL
                                </p>
                            </div>
                        </div>

                        <p className="launch-price">Launch Price: <span>0.00 Base/Quote</span></p>

                        <div className="launch-date-toggle">
                            <span>Set Launch Date</span>
                            <div 
                                className="toggle-switch"
                                onClick={() => setLaunchDateEnabled(!launchDateEnabled)}
                            />
                        </div>

                        <button 
                            className="create-pool-button" 
                            onClick={handleCreatePool}
                            disabled={!isWalletConnected || !selectedToken || !selectedQuoteToken || !solAmount || !tokenAmount}
                        >
                            {!isWalletConnected 
                                ? 'Connect Wallet' 
                                : !selectedToken 
                                ? 'Select Token' 
                                : !selectedQuoteToken
                                ? 'Select Quote Token'
                                : !solAmount || !tokenAmount 
                                ? 'Enter Amounts' 
                                : 'Create Liquidity Pool'}
                        </button>

                        <div className="pool-info">
                            <p>Adding to Liquidity Pool: <span>0 Base + 0 Quote</span></p>
                            <p>Total Fees: <span>0.2 SOL</span></p>
                        </div>
                    </div>
                </div>

                {/* Manage Liquidity Card */}
                <div className="liquidity-card">
                    <h1 className="card-title">Manage Liquidity</h1>
                    
                    {/* Tab Buttons */}
                    <div className="manage-tabs">
                        <button 
                            className={`tab-button ${activeTab === 'add' ? 'active' : ''}`}
                            onClick={() => setActiveTab('add')}
                        >
                            Add Liquidity
                        </button>
                        <button 
                            className={`tab-button ${activeTab === 'remove' ? 'active' : ''}`}
                            onClick={() => setActiveTab('remove')}
                        >
                            Remove Liquidity
                        </button>
                    </div>

                    {/* Add Liquidity Form */}
                    <div className="manage-content">
                        {activeTab === 'add' ? (
                            <>
                                <div className="input-group">
                                    <label className="input-label">Liquidity Pool<span>*</span></label>
                                    <select 
                                        className="token-select"
                                        value={selectedToken?.tokenMintAddress || ''}
                                        onChange={(e) => handleTokenSelection(e.target.value)}
                                    >
                                        <option value="">Choose Your Token</option>
                                        {tokens
                                            .filter(token => token.isValid)
                                            .map((token) => (
                                                <option 
                                                    key={token.tokenMintAddress} 
                                                    value={token.tokenMintAddress}
                                                >
                                                    {token.name} ({token.symbol})
                                                </option>
                                            ))
                                        }
                                    </select>
                                </div>

                                <div className="amount-inputs">
                                    <div className="input-group">
                                        <input 
                                            type="text" 
                                            className="amount-input" 
                                            placeholder="Base amount" 
                                            value={tokenAmount} 
                                            onChange={(e) => {
                                                const newTokenAmount = e.target.value;
                                                setTokenAmount(newTokenAmount);
                                                if (poolStats.totalTokens > 0) {
                                                    const solInPool = formatSolAmount(poolStats.totalSol);
                                                    const ratio = parseFloat(solInPool) / poolStats.totalTokens;
                                                    setSolAmount((parseFloat(newTokenAmount) * ratio).toFixed(9));
                                                }
                                            }}
                                        />
                                        <p className="balance-text">
                                            Balance: {tokenBalance} {selectedToken?.symbol || 'tokens'}
                                        </p>
                                    </div>
                                    <div className="input-group">
                                        <input 
                                            type="text" 
                                            className="amount-input" 
                                            placeholder="Quote amount (SOL)" 
                                            value={solAmount} 
                                            onChange={(e) => {
                                                const newSolAmount = e.target.value;
                                                setSolAmount(newSolAmount);
                                                if (poolStats.totalSol > 0) {
                                                    const solInPool = formatSolAmount(poolStats.totalSol);
                                                    const ratio = poolStats.totalTokens / parseFloat(solInPool);
                                                    setTokenAmount((parseFloat(newSolAmount) * ratio).toFixed(9));
                                                }
                                            }}
                                        />
                                        <p className="balance-text">
                                            Balance: {solBalance.toFixed(9)} SOL
                                        </p>
                                    </div>
                                </div>
                            </>
                        ) : (
                            // Remove Liquidity Interface
                            <>
                                <div className="input-group">
                                    <label className="input-label">Liquidity Pool<span>*</span></label>
                                    <select 
                                        className="token-select"
                                        value={selectedToken?.tokenMintAddress || ''}
                                        onChange={(e) => handleTokenSelection(e.target.value)}
                                    >
                                        <option value="">Choose Your Token</option>
                                        {tokens.filter(token => token.isValid).map((token) => (
                                            <option key={token.tokenMintAddress} value={token.tokenMintAddress}>
                                                {token.symbol}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                
                                <div className="input-group">
                                    <input 
                                        type="text" 
                                        className="amount-input" 
                                        placeholder="Enter amount to withdraw" 
                                        value={tokenAmount} 
                                        onChange={(e) => {
                                            setTokenAmount(e.target.value);
                                            if (poolStats.totalTokens > 0) {
                                                const solInPool = poolStats.totalSol / LAMPORTS_PER_SOL;
                                                const ratio = solInPool / poolStats.totalTokens;
                                                setSolAmount((parseFloat(e.target.value) * ratio).toFixed(9));
                                            }
                                        }}
                                    />
                                    <p className="balance-text">
                                        Pool Balance: {poolStats.totalTokens} {selectedToken?.symbol || 'tokens'}
                                    </p>
                                </div>

                                <div className="withdrawal-info">
                                    <p>
                                        You Will withdraw: {solAmount} SOL + {tokenAmount} {selectedToken?.symbol || 'tokens'}
                                    </p>
                                </div>
                            </>
                        )}

                        <button 
                            className="manage-button"
                            onClick={activeTab === 'add' ? handleCreatePool : handleRemoveLiquiditySubmit}
                            disabled={!isWalletConnected || !selectedToken || (!tokenAmount && activeTab === 'remove') || ((!solAmount || !tokenAmount) && activeTab === 'add')}
                        >
                            {activeTab === 'add' ? 
                                (!isWalletConnected ? 'Connect Wallet' : !selectedToken ? 'Select Token' : !selectedQuoteToken ? 'Select Quote Token' : !solAmount || !tokenAmount ? 'Enter Amounts' : 'Add Liquidity') :
                                (!isWalletConnected ? 'Connect Wallet' : !selectedToken ? 'Select Token' : !tokenAmount ? 'Enter Amount' : 'Remove Liquidity')
                            }
                        </button>

                        <div className="pool-info">
                            <p>
                                Current Pool Stats:
                                <br />
                                SOL: {formatSolAmount(poolStats.totalSol)}
                                <br />
                                {selectedToken?.symbol}: {Number(poolStats.totalTokens).toFixed(9)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LiquidityPage; 