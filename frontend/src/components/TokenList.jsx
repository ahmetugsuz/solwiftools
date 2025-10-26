import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/TokenList.css';
import { toast } from 'react-hot-toast';

const TokenList = ({ walletAddress }) => {
    const [tokens, setTokens] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (walletAddress) {
            fetchTokens();
        }
    }, [walletAddress]);

    const fetchTokens = async () => {
        try {
            const response = await axios.get(`/api/tokens/list/${walletAddress}`);
            console.log('Fetched tokens with images:', response.data.tokens.map(t => ({
                name: t.name,
                symbol: t.symbol,
                imageUrl: t.imageUrl
            })));
            setTokens(response.data.tokens);
        } catch (error) {
            console.error('Error fetching tokens:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleMintMore = async (tokenMint, amount) => {
        try {
            const response = await axios.post('/api/tokens/mint', {
                tokenMint,
                amount,
                walletAddress
            });
            // Refresh token list after minting
            fetchTokens();
        } catch (error) {
            console.error('Error minting tokens:', error);
            alert('Failed to mint tokens: ' + error.message);
        }
    };

    const handleFreeze = async (tokenMint) => {
        try {
            const response = await axios.post('/api/tokens/freeze', {
                tokenMint,
                walletAddress
            });
            fetchTokens();
        } catch (error) {
            console.error('Error freezing token:', error);
            alert('Failed to freeze token: ' + error.message);
        }
    };

    const handleDeleteToken = async (tokenMintAddress) => {
        try {
            await axios.delete(`/api/tokens/${tokenMintAddress}`);
            // Remove the token from the local state
            setTokens(tokens.filter(token => token.tokenMintAddress !== tokenMintAddress));
            toast.success('Token removed from list');
        } catch (error) {
            console.error('Error deleting token:', error);
            toast.error('Failed to remove token');
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="token-list">
            <div className="token-list-header">
                <h2 className="text-2xl font-bold">Your Tokens</h2>
                <button
                    onClick={fetchTokens}
                    className="refresh-button"
                    title="Refresh token list"
                >
                    <span className="refresh-icon">↻</span>
                </button>
            </div>
            
            {tokens.filter(token => token.paymentStatus === 'completed').length === 0 ? (
                <p className="text-gray-500">No tokens found. Create one to get started!</p>
            ) : (
                <div className="token-grid">
                    {tokens.filter(token => token.paymentStatus === 'completed').map((token) => (
                        <div key={token.tokenMintAddress} className="token-card">
                            <div className="token-card-header">
                                <button 
                                    onClick={() => handleDeleteToken(token.tokenMintAddress)}
                                    className="token-close-button"
                                    title="Remove from list"
                                >
                                    ×
                                </button>
                            </div>
                            <div className="token-card-content">
                                <div className="token-card-left">
                                    <div>
                                        <h3 className="font-bold">{token.name}</h3>
                                        <p className="text-sm text-gray-600">{token.symbol}</p>
                                    </div>

                                    <div className="text-sm mb-3">
                                        <p className="text-gray-600">Supply: {token.supply}</p>
                                        <p className="text-gray-600">Decimals: {token.decimals}</p>
                                        <p className="text-gray-600">
                                            Mint: {token.tokenMintAddress.slice(0, 20)}...
                                        </p>
                                    </div>

                                    <div className="token-buttons">
                                        <button
                                            onClick={() => handleMintMore(token.tokenMintAddress, 1000)}
                                            className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                                            disabled={token.isFrozen}
                                        >
                                            Mint More
                                        </button>
                                        {/* Add-on boxes for Mint, Freeze, Update */}
                                        <div className="addon-boxes">
                                            {/* Mint Box */}
                                            <div 
                                                className={`addon-box ${token.revokeAuthorities?.mint ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}
                                                title={token.revokeAuthorities?.mint ? 'Mint authority revoked' : 'Mint authority active'}
                                            >
                                                Mint
                                            </div>
                                            {/* Freeze Box */}
                                            <button
                                                className={`addon-box ${token.revokeAuthorities?.freeze ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}
                                                disabled={token.revokeAuthorities?.freeze}
                                                onClick={() => handleFreeze(token.tokenMintAddress)}
                                                title={token.revokeAuthorities?.freeze ? 'Freeze authority revoked' : 'Click to revoke freeze authority'}
                                            >
                                                Freeze
                                            </button>
                                            {/* Update Box */}
                                            <button
                                                className={`addon-box ${token.revokeAuthorities?.update ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}
                                                disabled={token.revokeAuthorities?.update}
                                                title={token.revokeAuthorities?.update ? 'Update authority revoked' : 'Update authority active'}
                                            >
                                                Update
                                            </button>
                                        </div>
                                        <a
                                            href={`https://explorer.solana.com/address/${token.tokenMintAddress}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-500 hover:text-blue-700 text-sm"
                                        >
                                            View ↗
                                        </a>
                                    </div>
                                </div>
                                <div className="token-card-right">
                                    {token.imageUrl ? (
                                        <img 
                                            src={`http://localhost:5050${token.imageUrl}`}
                                            alt={`${token.name} logo`}
                                            className="token-logo"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                console.error('Image failed to load:', {
                                                    url: `http://localhost:5050${token.imageUrl}`,
                                                    token: token.name,
                                                    error: e.error
                                                });
                                                e.target.src = '/default-token.png';
                                            }}
                                            onLoad={() => console.log('Image loaded successfully:', token.imageUrl)}
                                        />
                                    ) : (
                                        <div className="token-logo-placeholder">
                                            {token.symbol.charAt(0)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TokenList; 