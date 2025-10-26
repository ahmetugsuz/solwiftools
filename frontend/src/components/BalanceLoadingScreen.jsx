import React from 'react';
import '../styles/BalanceLoadingScreen.css';

const BalanceLoadingScreen = () => {
  return (
    <div className="balance-loading-overlay">
      <div className="balance-loading-container">
        <div className="loading-spinner"></div>
        <h2 className="loading-title">Checking Balance</h2>
        <p className="loading-message">Please wait while we fetch your wallet balances...</p>
      </div>
    </div>
  );
};

export default BalanceLoadingScreen; 