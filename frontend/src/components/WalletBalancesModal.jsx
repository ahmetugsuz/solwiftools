import React from 'react';
import '../styles/WalletBalancesModal.css';
import { FaTimes } from 'react-icons/fa';

const WalletBalancesModal = ({ isOpen, onClose, wallets }) => {
  if (!isOpen) return null;

  return (
    <div className="wallet-balances-overlay">
      <div className="wallet-balances-container">
        <button className="close-button" onClick={onClose}>
          <FaTimes />
        </button>
        
        <div className="terminal-output">
          {wallets.map((wallet, index) => (
            <div key={index} className="wallet-balance-line">
              <span className="wallet-index">[wallet [{index + 1}]]</span> 
              <span className="wallet-address">{wallet.publicKey}</span> 
              <span className="wallet-balance">{wallet.balance}</span>
            </div>
          ))}
        </div>
        
        <button className="close-button-bottom" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
};

export default WalletBalancesModal; 