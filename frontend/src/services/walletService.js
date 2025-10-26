import { Keypair, Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import bs58 from 'bs58';

// Initialize Solana connection (mainnet for production)
const connection = new Connection('https://maximum-falling-leaf.solana-mainnet.quiknode.pro/f8542a105543937e8a2a44ae2cd850a1cd2ee6cc/', 'confirmed');

// Extract balance value from string
const extractBalanceValue = (balanceStr) => {
  if (typeof balanceStr === 'number') return balanceStr;
  if (!balanceStr) return 0;
  
  const matches = balanceStr.match(/(\d+(\.\d+)?)/);
  if (matches && matches.length > 0) {
    return parseFloat(matches[0]);
  }
  
  return 0;
};

// Function to generate multiple wallets
export const generateWallets = async (numberOfWallets, groupName = 'Default') => {
  try {
    const wallets = [];
    const timestamp = new Date().toISOString();
    
    for (let i = 0; i < numberOfWallets; i++) {
      const wallet = Keypair.generate();
      
      // Convert the wallet to a format we can use
      const walletData = {
        publicKey: wallet.publicKey.toString(),
        secretKey: bs58.encode(wallet.secretKey),
        balance: "0 SOL",
        createdDate: timestamp,
        status: "Active",
        group: groupName,
        lastActivity: null,
        activityHistory: [],
        rotationIndex: 0,
        rotationEnabled: false,
        tags: []
      };
      
      wallets.push(walletData);
      
      // In a real application, you might want to store these securely
      // For now, we'll just store them in localStorage for demo purposes
      storeWalletInLocalStorage(walletData);
    }
    
    // Create/update the group in localStorage if it doesn't exist
    addOrUpdateWalletGroup(groupName, {
      name: groupName,
      createdDate: timestamp,
      walletCount: numberOfWallets,
      rotationStrategy: 'sequential',
      rotationEnabled: false,
      rotationInterval: 24, // hours
      activityPattern: 'natural' // natural, random, or aggressive
    });
    
    return wallets;
  } catch (error) {
    console.error("Error generating wallets:", error);
    throw error;
  }
};

// Function to store wallet in localStorage
const storeWalletInLocalStorage = (wallet) => {
  try {
    // Get existing wallets from localStorage
    const existingWalletsJSON = localStorage.getItem('solanaWallets');
    const existingWallets = existingWalletsJSON ? JSON.parse(existingWalletsJSON) : [];
    
    // Check if wallet already exists
    const existingIndex = existingWallets.findIndex(w => w.publicKey === wallet.publicKey);
    
    if (existingIndex >= 0) {
      // Update existing wallet
      existingWallets[existingIndex] = {
        ...existingWallets[existingIndex],
        ...wallet
      };
    } else {
      // Add new wallet
      existingWallets.push(wallet);
    }
    
    // Save back to localStorage
    localStorage.setItem('solanaWallets', JSON.stringify(existingWallets));
  } catch (error) {
    console.error("Error storing wallet in localStorage:", error);
  }
};

// Function to get all wallets from localStorage
export const getWallets = () => {
  try {
    const walletsJSON = localStorage.getItem('solanaWallets');
    return walletsJSON ? JSON.parse(walletsJSON) : [];
  } catch (error) {
    console.error("Error retrieving wallets from localStorage:", error);
    return [];
  }
};

// Function to get wallet groups from localStorage
export const getWalletGroups = () => {
  try {
    const groupsJSON = localStorage.getItem('walletGroups');
    return groupsJSON ? JSON.parse(groupsJSON) : [];
  } catch (error) {
    console.error("Error retrieving wallet groups:", error);
    return [];
  }
};

// Function to add or update a wallet group
export const addOrUpdateWalletGroup = (groupName, groupData) => {
  try {
    const groups = getWalletGroups();
    const existingIndex = groups.findIndex(g => g.name === groupName);
    
    if (existingIndex >= 0) {
      // Update existing group
      groups[existingIndex] = {
        ...groups[existingIndex],
        ...groupData,
        walletCount: countWalletsInGroup(groupName)
      };
    } else {
      // Add new group
      groups.push({
        ...groupData,
        walletCount: countWalletsInGroup(groupName)
      });
    }
    
    // Save back to localStorage
    localStorage.setItem('walletGroups', JSON.stringify(groups));
    return true;
  } catch (error) {
    console.error("Error updating wallet group:", error);
    return false;
  }
};

// Count wallets in a specific group
const countWalletsInGroup = (groupName) => {
  const wallets = getWallets();
  return wallets.filter(wallet => wallet.group === groupName).length;
};

// Function to delete a wallet group and optionally its wallets
export const deleteWalletGroup = (groupName, deleteWallets = false) => {
  try {
    // Get all groups
    const groups = getWalletGroups();
    const updatedGroups = groups.filter(g => g.name !== groupName);
    
    // Save updated groups
    localStorage.setItem('walletGroups', JSON.stringify(updatedGroups));
    
    // If deleteWallets is true, delete all wallets in this group
    if (deleteWallets) {
      const wallets = getWallets();
      const updatedWallets = wallets.filter(w => w.group !== groupName);
      localStorage.setItem('solanaWallets', JSON.stringify(updatedWallets));
    } else {
      // Otherwise, move wallets to "Default" group
      const wallets = getWallets();
      const updatedWallets = wallets.map(w => {
        if (w.group === groupName) {
          return { ...w, group: 'Default' };
        }
        return w;
      });
      localStorage.setItem('solanaWallets', JSON.stringify(updatedWallets));
      
      // Make sure Default group exists
      addOrUpdateWalletGroup('Default', {
        name: 'Default',
        createdDate: new Date().toISOString(),
        walletCount: countWalletsInGroup('Default'),
        rotationStrategy: 'sequential',
        rotationEnabled: false,
        rotationInterval: 24,
        activityPattern: 'natural'
      });
    }
    
    return true;
  } catch (error) {
    console.error("Error deleting wallet group:", error);
    return false;
  }
};

// Function to update wallet tags
export const updateWalletTags = (publicKey, tags) => {
  try {
    const wallets = getWallets();
    const walletIndex = wallets.findIndex(w => w.publicKey === publicKey);
    
    if (walletIndex >= 0) {
      wallets[walletIndex].tags = tags;
      localStorage.setItem('solanaWallets', JSON.stringify(wallets));
      return true;
    }
    
    return false;
  } catch (error) {
    console.error("Error updating wallet tags:", error);
    return false;
  }
};

// Function to move wallets to a different group
export const moveWalletsToGroup = (walletPublicKeys, targetGroup) => {
  try {
    const wallets = getWallets();
    const updatedWallets = wallets.map(wallet => {
      if (walletPublicKeys.includes(wallet.publicKey)) {
        return { ...wallet, group: targetGroup };
      }
      return wallet;
    });
    
    localStorage.setItem('solanaWallets', JSON.stringify(updatedWallets));
    
    // Update group wallet counts
    const groups = getWalletGroups();
    groups.forEach(group => {
      addOrUpdateWalletGroup(group.name, {
        ...group,
        walletCount: countWalletsInGroup(group.name)
      });
    });
    
    return true;
  } catch (error) {
    console.error("Error moving wallets to group:", error);
    return false;
  }
};

// Function to get the next wallet in rotation for a group
export const getNextWalletInRotation = (groupName) => {
  try {
    const wallets = getWallets().filter(w => w.group === groupName);
    const group = getWalletGroups().find(g => g.name === groupName);
    
    if (!wallets.length || !group || !group.rotationEnabled) {
      return null;
    }
    
    let nextWallet = null;
    
    if (group.rotationStrategy === 'sequential') {
      // Sort by rotationIndex and find the wallet with lowest index
      wallets.sort((a, b) => a.rotationIndex - b.rotationIndex);
      nextWallet = wallets[0];
    } else if (group.rotationStrategy === 'random') {
      // Pick a random wallet
      const randomIndex = Math.floor(Math.random() * wallets.length);
      nextWallet = wallets[randomIndex];
    } else if (group.rotationStrategy === 'balance') {
      // Sort by balance and use the wallet with highest balance
      wallets.sort((a, b) => extractBalanceValue(b.balance) - extractBalanceValue(a.balance));
      nextWallet = wallets[0];
    } else if (group.rotationStrategy === 'activity') {
      // Use the wallet with least recent activity
      wallets.sort((a, b) => {
        if (!a.lastActivity) return -1;
        if (!b.lastActivity) return 1;
        return new Date(a.lastActivity) - new Date(b.lastActivity);
      });
      nextWallet = wallets[0];
    }
    
    if (nextWallet) {
      // Update the rotation index for this wallet
      const allWallets = getWallets();
      const walletIndex = allWallets.findIndex(w => w.publicKey === nextWallet.publicKey);
      
      if (walletIndex >= 0) {
        allWallets[walletIndex].rotationIndex += 1;
        allWallets[walletIndex].lastActivity = new Date().toISOString();
        
        // Add to activity history
        if (!allWallets[walletIndex].activityHistory) {
          allWallets[walletIndex].activityHistory = [];
        }
        
        allWallets[walletIndex].activityHistory.push({
          date: new Date().toISOString(),
          type: 'rotation',
          details: `Selected by ${group.rotationStrategy} rotation strategy`
        });
        
        localStorage.setItem('solanaWallets', JSON.stringify(allWallets));
      }
    }
    
    return nextWallet;
  } catch (error) {
    console.error("Error getting next wallet in rotation:", error);
    return null;
  }
};

// Function to update wallet rotation settings for a group
export const updateGroupRotationSettings = (groupName, rotationSettings) => {
  try {
    const groups = getWalletGroups();
    const groupIndex = groups.findIndex(g => g.name === groupName);
    
    if (groupIndex >= 0) {
      groups[groupIndex] = {
        ...groups[groupIndex],
        ...rotationSettings
      };
      
      localStorage.setItem('walletGroups', JSON.stringify(groups));
      return true;
    }
    
    return false;
  } catch (error) {
    console.error("Error updating group rotation settings:", error);
    return false;
  }
};

// Function to record wallet activity
export const recordWalletActivity = (publicKey, activityType, details) => {
  try {
    const wallets = getWallets();
    const walletIndex = wallets.findIndex(w => w.publicKey === publicKey);
    
    if (walletIndex >= 0) {
      const activityRecord = {
        date: new Date().toISOString(),
        type: activityType,
        details: details
      };
      
      if (!wallets[walletIndex].activityHistory) {
        wallets[walletIndex].activityHistory = [];
      }
      
      wallets[walletIndex].activityHistory.push(activityRecord);
      wallets[walletIndex].lastActivity = activityRecord.date;
      
      localStorage.setItem('solanaWallets', JSON.stringify(wallets));
      return true;
    }
    
    return false;
  } catch (error) {
    console.error("Error recording wallet activity:", error);
    return false;
  }
};

// Function to generate randomized wallet activity based on pattern
export const generateRandomActivity = (groupName) => {
  try {
    const group = getWalletGroups().find(g => g.name === groupName);
    if (!group) return false;
    
    const wallets = getWallets().filter(w => w.group === groupName);
    if (!wallets.length) return false;
    
    const activityPattern = group.activityPattern || 'natural';
    const now = new Date();
    
    // Number of transactions to generate based on pattern
    let transactionCount = 0;
    if (activityPattern === 'natural') {
      // Natural pattern: 1-3 transactions per day
      transactionCount = Math.floor(Math.random() * 3) + 1;
    } else if (activityPattern === 'random') {
      // Random pattern: 3-8 transactions per day
      transactionCount = Math.floor(Math.random() * 6) + 3;
    } else if (activityPattern === 'aggressive') {
      // Aggressive pattern: 8-15 transactions per day
      transactionCount = Math.floor(Math.random() * 8) + 8;
    }
    
    // Simulate transactions for each wallet
    for (let i = 0; i < transactionCount; i++) {
      // Choose a random wallet from the group
      const randomIndex = Math.floor(Math.random() * wallets.length);
      const wallet = wallets[randomIndex];
      
      // Random transaction type (send, receive, swap)
      const transactionTypes = ['send', 'receive', 'swap'];
      const transactionType = transactionTypes[Math.floor(Math.random() * transactionTypes.length)];
      
      // Random amount (0.001 - 0.5 SOL)
      const amount = (Math.random() * 0.499 + 0.001).toFixed(3);
      
      // Random time in the past 24 hours
      const randomTime = new Date(now - Math.floor(Math.random() * 24 * 60 * 60 * 1000));
      
      // Record the activity
      recordWalletActivity(wallet.publicKey, transactionType, {
        amount: `${amount} SOL`,
        timestamp: randomTime.toISOString(),
        simulated: true
      });
    }
    
    return true;
  } catch (error) {
    console.error("Error generating random activity:", error);
    return false;
  }
};

// Function to check wallet balance using real Solana RPC
export const checkWalletBalance = async (publicKey) => {
  try {
    // First check if we're in development/demo mode
    if (process.env.REACT_APP_USE_MOCK_DATA === 'true') {
      // Use the stored mock data
      const wallets = getWallets();
      const wallet = wallets.find(w => w.publicKey === publicKey);
      
      if (wallet) {
        const currentBalance = extractBalanceValue(wallet.balance);
        return `${currentBalance.toFixed(2)} SOL`;
      }
      
      return "0 SOL";
    }
    
    // For a real implementation, connect to Solana and get the actual balance
    try {
      const publicKeyObj = new PublicKey(publicKey);
      const balance = await connection.getBalance(publicKeyObj);
      
      // Convert lamports to SOL (1 SOL = 1,000,000,000 lamports)
      const solBalance = balance / 1000000000;
      return `${solBalance.toFixed(2)} SOL`;
    } catch (rpcError) {
      console.error("Error fetching balance from Solana:", rpcError);
      
      // Fallback to stored balance
      const wallets = getWallets();
      const wallet = wallets.find(w => w.publicKey === publicKey);
      
      if (wallet) {
        return wallet.balance;
      }
      
      return "0 SOL";
    }
  } catch (error) {
    console.error("Error checking wallet balance:", error);
    return "0 SOL";
  }
};

// Function to update all wallet balances with real Solana data
export const updateAllWalletBalances = async () => {
  try {
    const wallets = getWallets();
    
    if (wallets.length === 0) {
      return [];
    }
    
    // For each wallet, update its balance
    const updatedWallets = await Promise.all(wallets.map(async (wallet) => {
      const balance = await checkWalletBalance(wallet.publicKey);
      return {
        ...wallet,
        balance
      };
    }));
    
    // Save the updated wallets
    localStorage.setItem('solanaWallets', JSON.stringify(updatedWallets));
    
    return updatedWallets;
  } catch (error) {
    console.error("Error updating wallet balances:", error);
    return getWallets(); // Return existing wallets if there's an error
  }
};

// Function to export wallets
export const exportWallets = () => {
  try {
    const wallets = getWallets();
    
    // Create a JSON file for download
    const dataStr = JSON.stringify(wallets, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    // Create a download link and trigger it
    const exportFileDefaultName = 'solana-wallets.json';
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    return true;
  } catch (error) {
    console.error("Error exporting wallets:", error);
    return false;
  }
};

// Function to import wallets from a JSON file
export const importWalletsFromJSON = (walletsJSON) => {
  try {
    const wallets = JSON.parse(walletsJSON);
    
    // Validate the wallets format
    if (!Array.isArray(wallets)) {
      throw new Error("Invalid wallet format");
    }
    
    // Store each wallet
    wallets.forEach(wallet => {
      if (wallet.publicKey && wallet.secretKey) {
        // Ensure the wallet has group and other properties
        const enhancedWallet = {
          ...wallet,
          group: wallet.group || 'Default',
          lastActivity: wallet.lastActivity || null,
          activityHistory: wallet.activityHistory || [],
          rotationIndex: wallet.rotationIndex || 0,
          rotationEnabled: wallet.rotationEnabled || false,
          tags: wallet.tags || []
        };
        storeWalletInLocalStorage(enhancedWallet);
      }
    });
    
    // Make sure all groups exist
    const uniqueGroups = [...new Set(wallets.map(w => w.group || 'Default'))];
    uniqueGroups.forEach(groupName => {
      addOrUpdateWalletGroup(groupName, {
        name: groupName,
        createdDate: new Date().toISOString(),
        walletCount: countWalletsInGroup(groupName),
        rotationStrategy: 'sequential',
        rotationEnabled: false,
        rotationInterval: 24,
        activityPattern: 'natural'
      });
    });
    
    return wallets;
  } catch (error) {
    console.error("Error importing wallets:", error);
    throw error;
  }
};

// Function to delete a wallet
export const deleteWallet = (publicKey) => {
  try {
    const wallets = getWallets();
    const updatedWallets = wallets.filter(wallet => wallet.publicKey !== publicKey);
    localStorage.setItem('solanaWallets', JSON.stringify(updatedWallets));
    
    // Update all group wallet counts
    const groups = getWalletGroups();
    groups.forEach(group => {
      addOrUpdateWalletGroup(group.name, {
        ...group,
        walletCount: countWalletsInGroup(group.name)
      });
    });
    
    return true;
  } catch (error) {
    console.error("Error deleting wallet:", error);
    return false;
  }
};

// Function to send SOL to multiple wallets
export const sendSolToWallets = async (amount, walletPublicKeys) => {
  try {
    // In a real application, you would make API calls to a Solana node
    // to transfer SOL to each wallet
    
    // For now, we'll simulate the process with a delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Calculate the amount per wallet (distribute evenly)
    const walletCount = walletPublicKeys.length;
    const amountPerWallet = walletCount > 0 ? amount / walletCount : 0;
    
    // Update the wallets in localStorage with the new balance
    const wallets = getWallets();
    const updatedWallets = wallets.map(wallet => {
      if (walletPublicKeys.includes(wallet.publicKey)) {
        // Add the distributed amount to the wallet's balance
        // Extract current balance numeric value (remove "SOL" and convert to number)
        const currentBalanceText = wallet.balance || "0 SOL";
        const currentBalance = extractBalanceValue(currentBalanceText);
        const newBalance = currentBalance + amountPerWallet;
        
        // Record this activity
        recordWalletActivity(wallet.publicKey, 'receive', {
          amount: `${amountPerWallet.toFixed(2)} SOL`,
          timestamp: new Date().toISOString(),
          source: 'batch distribution'
        });
        
        return {
          ...wallet,
          balance: `${newBalance.toFixed(2)} SOL`
        };
      }
      return wallet;
    });
    
    // Save the updated wallets
    localStorage.setItem('solanaWallets', JSON.stringify(updatedWallets));
    
    return {
      success: true,
      amountPerWallet,
      updatedWallets // Return the updated wallets for immediate use
    };
  } catch (error) {
    console.error("Error sending SOL to wallets:", error);
    throw error;
  }
};

// Get wallet analytics for a specific group or all wallets
export const getWalletAnalytics = (groupName = null) => {
  try {
    const wallets = groupName 
      ? getWallets().filter(w => w.group === groupName)
      : getWallets();
    
    if (!wallets.length) {
      return {
        totalWallets: 0,
        totalBalance: 0,
        avgBalance: 0,
        totalActivity: 0,
        activeWallets: 0,
        inactiveWallets: 0,
        balanceDistribution: []
      };
    }
    
    // Calculate total balance
    const totalBalance = wallets.reduce((sum, wallet) => {
      return sum + extractBalanceValue(wallet.balance);
    }, 0);
    
    // Calculate average balance
    const avgBalance = totalBalance / wallets.length;
    
    // Count total activities across all wallets
    const totalActivity = wallets.reduce((sum, wallet) => {
      return sum + (wallet.activityHistory ? wallet.activityHistory.length : 0);
    }, 0);
    
    // Count active wallets (had activity in last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const activeWallets = wallets.filter(wallet => {
      if (!wallet.lastActivity) return false;
      const lastActivityDate = new Date(wallet.lastActivity);
      return lastActivityDate >= sevenDaysAgo;
    }).length;
    
    // Calculate balance distribution in buckets
    const balanceBuckets = [0, 0.1, 0.5, 1, 5, 10, 50, 100, Infinity];
    const balanceDistribution = balanceBuckets.slice(0, -1).map((min, index) => {
      const max = balanceBuckets[index + 1];
      const count = wallets.filter(wallet => {
        const balance = extractBalanceValue(wallet.balance);
        return balance >= min && balance < max;
      }).length;
      
      return {
        range: max === Infinity ? `${min}+` : `${min}-${max}`,
        count,
        percentage: (count / wallets.length * 100).toFixed(1)
      };
    });
    
    return {
      totalWallets: wallets.length,
      totalBalance: totalBalance.toFixed(2),
      avgBalance: avgBalance.toFixed(2),
      totalActivity,
      activeWallets,
      inactiveWallets: wallets.length - activeWallets,
      balanceDistribution
    };
  } catch (error) {
    console.error("Error calculating wallet analytics:", error);
    return null;
  }
};