import React, { useState, useEffect } from 'react';
import { FaWallet, FaCoins, FaUserFriends, FaChartLine } from 'react-icons/fa';
import { getWallets, updateAllWalletBalances } from '../services/walletService';
import '../styles/WalletStats.css';

// Helper function to extract numeric value from balance string
const extractBalanceValue = (balanceStr) => {
  // If it's already a number, return it
  if (typeof balanceStr === 'number') return balanceStr;
  
  // If it's undefined or null, return 0
  if (!balanceStr) return 0;
  
  // Extract numeric part using regex to get only the number
  const matches = balanceStr.match(/(\d+(\.\d+)?)/);
  if (matches && matches.length > 0) {
    return parseFloat(matches[0]);
  }
  
  return 0;
};

const WalletStats = ({ wallets = [] }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [walletStats, setWalletStats] = useState({
    totalRevenue: 0,
    totalActiveWallets: 0,
    totalWalletsBalance: 0,
    totalTokensInWallets: 0
  });

  // Load and calculate wallet statistics
  useEffect(() => {
    const fetchWalletStats = async () => {
      setIsLoading(true);
      try {
        // Use wallets from props if provided, otherwise fetch them
        if (wallets && wallets.length > 0) {
          calculateStats(wallets);
        } else {
          // Get updated wallets with real balances
          const updatedWallets = await updateAllWalletBalances();
          calculateStats(updatedWallets);
        }
      } catch (error) {
        console.error("Error updating wallet statistics:", error);
        // Fallback to stored wallets
        const storedWallets = getWallets();
        calculateStats(storedWallets);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWalletStats();
  }, [wallets]); // Recalculate when wallets change

  const calculateStats = (wallets) => {
    if (wallets.length > 0) {
      // Calculate total active wallets
      const activeWallets = wallets.filter(wallet => wallet.status === "Active").length;
      
      // Calculate total balance across all wallets
      let totalBalance = 0;
      wallets.forEach(wallet => {
        // Extract the numeric value from the balance string (e.g., "1.5 SOL" -> 1.5)
        const balanceValue = extractBalanceValue(wallet.balance);
        totalBalance += balanceValue;
      });
      
      // For demo purposes, we'll calculate an estimated revenue
      // In a real app, this would come from transaction history
      const estimatedRevenue = totalBalance * 100; // Just an example calculation
      
      // Update the wallet stats
      setWalletStats({
        totalRevenue: estimatedRevenue.toFixed(2),
        totalActiveWallets: activeWallets,
        totalWalletsBalance: totalBalance.toFixed(2),
        // For demo purposes, we'll use the same value as balance
        // In a real app, this would be the actual token count
        totalTokensInWallets: totalBalance.toFixed(2)
      });
    }
  };

  return (
    <div className="wallet-stats-container">
      <div className="stat-card">
        <div className="stat-icon revenue">
          <FaChartLine />
        </div>
        <div className="stat-content">
          <h3>Total Revenue</h3>
          <h2>${isLoading ? '...' : walletStats.totalRevenue}</h2>
          <p className="stat-change positive">+20.1% from last month</p>
        </div>
      </div>
      
      <div className="stat-card">
        <div className="stat-icon wallets">
          <FaWallet />
        </div>
        <div className="stat-content">
          <h3>Total Active Wallets</h3>
          <h2>{isLoading ? '...' : walletStats.totalActiveWallets}</h2>
          <p className="stat-change positive">
            {walletStats.totalActiveWallets > 0 ? `${walletStats.totalActiveWallets} active wallets` : 'No active wallets'}
          </p>
        </div>
      </div>
      
      <div className="stat-card">
        <div className="stat-icon balance">
          <FaCoins />
        </div>
        <div className="stat-content">
          <h3>Total Wallets Balance</h3>
          <h2>{isLoading ? '...' : walletStats.totalWalletsBalance} SOL</h2>
          <p className="stat-change positive">
            {walletStats.totalWalletsBalance > 0 ? 'Balance available' : 'No balance available'}
          </p>
        </div>
      </div>
      
      <div className="stat-card">
        <div className="stat-icon tokens">
          <FaUserFriends />
        </div>
        <div className="stat-content">
          <h3>Total Token In Wallets</h3>
          <h2>{isLoading ? '...' : walletStats.totalTokensInWallets}</h2>
          <p className="stat-change positive">
            {walletStats.totalTokensInWallets > 0 ? 'Tokens available' : 'No tokens available'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default WalletStats; 