import React from 'react';
import { FiCopy, FiExternalLink } from 'react-icons/fi';
import { BsCheckCircleFill } from 'react-icons/bs';
import toast from 'react-hot-toast';

const TokenSuccessModal = ({ isOpen, onClose, tokenDetails }) => {
    if (!isOpen) return null;

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard!', {
            duration: 2000,
            position: 'bottom-right',
            style: {
                background: '#10B981',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
            },
            icon: '📋'
        });
    };

    const glassBackground = {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(5px)'
    };

    const glassBackgroundDarker = {
        backgroundColor: 'rgba(255, 255, 255, 0.05)'
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ marginTop: '60px' }}>
            <div 
                className="absolute inset-0 bg-black/30" 
                style={{ backdropFilter: 'blur(20px)' }} 
                onClick={onClose}
            />
            <div className="rounded-2xl p-5 max-w-sm w-full shadow-xl relative text-white" style={glassBackground}>
                {/* Header */}
                <div className="text-center mb-4">
                    <div className="flex justify-center mb-2">
                        <BsCheckCircleFill className="text-green-500 text-3xl" />
                    </div>
                    <h2 className="text-xl font-bold text-white">Token Created Successfully!</h2>
                    <p className="text-gray-200 text-sm mt-1">Your token is now live on Solana</p>
                </div>

                {/* Token Details */}
                <div className="space-y-3 mb-4">
                    {/* Mint Address */}
                    <div className="rounded-lg p-2" style={glassBackgroundDarker}>
                        <label className="text-xs font-medium text-gray-200 block mb-1">
                            Token Mint Address
                        </label>
                        <div className="flex items-center justify-between">
                            <code className="text-xs text-gray-200 break-all">
                                {tokenDetails.mintAddress}
                            </code>
                            <button 
                                onClick={() => copyToClipboard(tokenDetails.mintAddress)}
                                className="ml-2 text-blue-400 hover:text-blue-300"
                                title="Copy to clipboard"
                            >
                                <FiCopy className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Token Name & Symbol */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-lg p-2" style={glassBackgroundDarker}>
                            <label className="text-xs font-medium text-gray-200 block mb-1">
                                Token Name
                            </label>
                            <p className="text-sm text-gray-200">{tokenDetails.name}</p>
                        </div>
                        <div className="rounded-lg p-2" style={glassBackgroundDarker}>
                            <label className="text-xs font-medium text-gray-200 block mb-1">
                                Symbol
                            </label>
                            <p className="text-sm text-gray-200">{tokenDetails.symbol}</p>
                        </div>
                    </div>

                    {/* Supply & Decimals */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-lg p-2" style={glassBackgroundDarker}>
                            <label className="text-xs font-medium text-gray-200 block mb-1">
                                Initial Supply
                            </label>
                            <p className="text-sm text-gray-200">{tokenDetails.supply}</p>
                        </div>
                        <div className="rounded-lg p-2" style={glassBackgroundDarker}>
                            <label className="text-xs font-medium text-gray-200 block mb-1">
                                Decimals
                            </label>
                            <p className="text-sm text-gray-200">{tokenDetails.decimals}</p>
                        </div>
                    </div>

                    {/* Add-on Status */}
                    <div className="rounded-lg p-2" style={glassBackgroundDarker}>
                        <label className="text-xs font-medium text-gray-200 block mb-1">
                            Authority Status
                        </label>
                        <div className="flex gap-2">
                            <div className={`px-2 py-1 rounded text-xs ${tokenDetails.revokeAuthorities?.mint ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                                Mint: {tokenDetails.revokeAuthorities?.mint ? 'Revoked' : 'Active'}
                            </div>
                            <div className={`px-2 py-1 rounded text-xs ${tokenDetails.revokeAuthorities?.freeze ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                                Freeze: {tokenDetails.revokeAuthorities?.freeze ? 'Revoked' : 'Active'}
                            </div>
                            <div className={`px-2 py-1 rounded text-xs ${tokenDetails.revokeAuthorities?.update ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                                Update: {tokenDetails.revokeAuthorities?.update ? 'Revoked' : 'Active'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col space-y-2">
                    <a 
                        href={`https://explorer.solana.com/address/${tokenDetails.mintAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm"
                    >
                        View on Solana Explorer
                        <FiExternalLink className="ml-2 w-4 h-4" />
                    </a>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-400/20 rounded-lg text-gray-200 hover:bg-white/10 transition-colors text-sm"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TokenSuccessModal; 