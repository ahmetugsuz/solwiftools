import React, { useState } from 'react';
import '../styles/GenerateWalletsModal.css';

const GenerateWalletsModal = ({ isOpen, onClose, onGenerate }) => {
  const [numberOfWallets, setNumberOfWallets] = useState(0);
  
  if (!isOpen) return null;
  
  const handleGenerate = () => {
    onGenerate(numberOfWallets);
    onClose();
  };
  
  const handleInputChange = (e) => {
    const value = parseInt(e.target.value) || 0;
    // Limit to max 25 wallets
    setNumberOfWallets(Math.min(value, 25));
  };
  
  return (
    <div className="modal-overlay">
      <div className="generate-wallets-modal">
        <h2>Generate Wallets</h2>
        
        <div className="wallet-number-input">
          <label htmlFor="walletNumber">Number of Wallets</label>
          <div className="input-with-controls">
            <input
              type="number"
              id="walletNumber"
              value={numberOfWallets}
              onChange={handleInputChange}
              min="0"
              max="25"
            />
            <div className="input-controls">
              <button 
                className="control-button"
                onClick={() => setNumberOfWallets(prev => Math.min(prev + 1, 25))}
              >
                ▲
              </button>
              <button 
                className="control-button"
                onClick={() => setNumberOfWallets(prev => Math.max(prev - 1, 0))}
              >
                ▼
              </button>
            </div>
          </div>
        </div>
        
        <div className="slider-container">
          <input
            type="range"
            min="0"
            max="25"
            value={numberOfWallets}
            onChange={handleInputChange}
            className="wallet-slider"
          />
        </div>
        
        <p className="wallet-note">Note: You can generate up to 25 wallets at a time.</p>
        
        <div className="modal-actions">
          <button className="cancel-button" onClick={onClose}>
            Cancel
          </button>
          <button 
            className="generate-button"
            onClick={handleGenerate}
            disabled={numberOfWallets <= 0}
          >
            Generate Wallets
          </button>
        </div>
      </div>
    </div>
  );
};

export default GenerateWalletsModal; 