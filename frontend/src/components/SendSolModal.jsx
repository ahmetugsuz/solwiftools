import React, { useState } from 'react';
import '../styles/SendSolModal.css';

const SendSolModal = ({ isOpen, onClose, onSend, selectedWallets, allWallets }) => {
  const [solAmount, setSolAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  if (!isOpen) return null;
  
  const handleSend = async () => {
    const numericAmount = parseFloat(solAmount) || 0;
    if (numericAmount < 0.001) {
      return; // Amount too small
    }
    
    setIsLoading(true);
    try {
      await onSend(numericAmount, selectedWallets);
      onClose();
    } catch (error) {
      console.error("Error sending SOL:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleInputChange = (e) => {
    const inputValue = e.target.value;
    setSolAmount(inputValue);
  };
  
  const numericAmount = parseFloat(solAmount) || 0;
  const isValidAmount = numericAmount >= 0.001;
  const walletCount = selectedWallets?.length || 0;
  const amountPerWallet = walletCount > 0 && numericAmount > 0 
    ? (numericAmount / walletCount).toFixed(2) 
    : '0';
  
  return (
    <div className="modal-overlay">
      <div className="send-sol-modal">
        <h2>Send SOL to wallets</h2>
        
        <div className="sol-amount-input">
          <label htmlFor="solAmount">Enter total SOL amount to distribute among wallets</label>
          <input
            type="text"
            id="solAmount"
            value={solAmount}
            onChange={handleInputChange}
            placeholder="0"
            className={!isValidAmount && numericAmount !== 0 ? "invalid-input" : ""}
          />
        </div>
        
        {numericAmount > 0 && (
          <div className="distribution-info">
            <p>
              Distributing to {walletCount} wallet{walletCount !== 1 ? 's' : ''} 
              ({amountPerWallet} SOL per wallet)
            </p>
            {walletCount === allWallets?.length && (
              <p className="distribution-note">All wallets will receive SOL</p>
            )}
          </div>
        )}
        
        <p className="sol-note">Note: Minimum amount must be greater than 0.001</p>
        
        <div className="modal-actions">
          <button className="cancel-button" onClick={onClose}>
            Cancel
          </button>
          <button 
            className="send-button"
            onClick={handleSend}
            disabled={!isValidAmount || isLoading}
          >
            {isLoading ? 'Sending...' : 'Send SOL to wallets'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SendSolModal; 