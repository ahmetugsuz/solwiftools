import React from 'react';
import { FiX } from 'react-icons/fi';
import '../styles/WalletModal.css';

const WalletModal = ({ isOpen, onClose, onConnectWallet }) => {
    if (!isOpen) return null;

    const wallets = [
        {
            name: 'Phantom',
            icon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDgiIGhlaWdodD0iMTA4IiB2aWV3Qm94PSIwIDAgMTA4IDEwOCIgZmlsbD0ibm9uZSI+CjxyZWN0IHdpZHRoPSIxMDgiIGhlaWdodD0iMTA4IiByeD0iMjYiIGZpbGw9IiNBQjlGRjIiLz4KPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik00Ni41MjY3IDY5LjkyMjlDNDIuMDA1NCA3Ni44NTA5IDM0LjQyOTIgODUuNjE4MiAyNC4zNDggODUuNjE4MkMxOS41ODI0IDg1LjYxODIgMTUuNDk1OSA4NC4wNDQ5IDEyLjQyMjQgODEuMzQ1N0MyMi4zMTEgNzYuNTk1NSAyNi45OTY0IDY0LjY4OTUgMjYuOTk2NCA1Mi45MDMyQzI2Ljk5NjQgNDEuMTE3IDIyLjMxMSAyOS4yMTA5IDEyLjQyMjQgMjQuNDYwN0MxNS40OTU5IDIxLjc2MTUgMTkuNTgyNCAyMC4xODgyIDI0LjM0OCAyMC4xODgyQzM4LjI2NjQgMjAuMTg4MiA0Ny4xNzA5IDM1LjM3NjQgNDcuMTcwOSA1Mi45MDMyQzQ3LjE3MDkgNTkuNzQ5NCA0Ni41MjY3IDY1LjMxMiA0Ni41MjY3IDY5LjkyMjlaTTYzLjQyMzEgODUuNjE4N0M3My41MDQzIDg1LjYxODcgODEuMDgwNSA3Ni44NTEzIDg1LjYwMTggNjkuOTIzNEM4NS42MDE4IDY1LjMxMjQgODYuMjQ2IDU5Ljc0OTggODYuMjQ2IDUyLjkwMzdDODYuMjQ2IDM1LjM3NjkgNzcuMzQxNSAyMC4xODg3IDYzLjQyMzEgMjAuMTg4N0M1OC42NTc1IDIwLjE4ODcgNTQuNTcxIDIxLjc2MTkgNTEuNDk3NSAyNC40NjExQzYxLjM4NjEgMjkuMjExNCA2Ni4wNzE1IDQxLjExNzQgNjYuMDcxNSA1Mi45MDM3QzY2LjA3MTUgNjQuNjkgNjEuMzg2MSA3Ni41OTU5IDUxLjQ5NzUgODEuMzQ2MUM1NC41NzEgODQuMDQ1NCA1OC42NTc1IDg1LjYxODcgNjMuNDIzMSA4NS42MTg3WiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+',
            id: 'phantom'
        }
    ];

    return (
        <div className="wallet-modal-overlay">
            <div className="wallet-modal">
                <div className="wallet-modal-header">
                    <h3>Connect a wallet</h3>
                    <button className="wallet-modal-close" onClick={onClose}>
                        <FiX size={24} />
                    </button>
                </div>

                <div className="wallet-list">
                    {wallets.map((wallet) => (
                        <button
                            key={wallet.id}
                            onClick={() => onConnectWallet(wallet.id)}
                            className="wallet-option"
                        >
                            <img 
                                src={wallet.icon} 
                                alt={`${wallet.name} icon`} 
                                className="wallet-icon"
                            />
                            <span className="wallet-name">{wallet.name}</span>
                        </button>
                    ))}
                </div>

                <div className="wallet-modal-footer">
                    New to Solana?{' '}
                    <a 
                        href="https://solana.com/learn/wallet" 
                        target="_blank" 
                        rel="noopener noreferrer"
                    >
                        Learn more about wallets
                    </a>
                </div>
            </div>
        </div>
    );
};

export default WalletModal; 