import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaWallet, FaDownload, FaCog, FaUser, FaArrowUp, FaArrowDown, FaArrowLeft, FaPaperPlane, FaExchangeAlt, FaCopy, FaTrashAlt } from 'react-icons/fa';
import { BiCube } from 'react-icons/bi';
import { MdEmail, MdRefresh } from 'react-icons/md';
import { TbArrowBack } from 'react-icons/tb';
import toast from 'react-hot-toast';
import IncomeChart from './IncomeChart';
import GenerateWalletsModal from './GenerateWalletsModal';
import SendSolModal from './SendSolModal';
import WalletStats from './WalletStats';
import AdvancedWalletManager from './AdvancedWalletManager';
import { generateWallets, getWallets, exportWallets, deleteWallet, sendSolToWallets, updateAllWalletBalances } from '../services/walletService';
import '../styles/WalletsSection.css';
import BalanceLoadingScreen from './BalanceLoadingScreen';
import WalletBalancesModal from './WalletBalancesModal';

const WalletsSection = () => {
  const [activeWalletSection, setActiveWalletSection] = useState('main');
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [privateKey, setPrivateKey] = useState('');
  const [selectedRows, setSelectedRows] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [filterText, setFilterText] = useState('');
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSendSolModal, setShowSendSolModal] = useState(false);
  const [showBalanceLoading, setShowBalanceLoading] = useState(false);
  const [showBalancesModal, setShowBalancesModal] = useState(false);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeActionMenu, setActiveActionMenu] = useState(null);

  // Load wallets on component mount and update their balances
  useEffect(() => {
    const fetchWallets = async () => {
      try {
        // Get updated wallets with balances
        const updatedWallets = await updateAllWalletBalances();
        setWallets(updatedWallets);
      } catch (error) {
        console.error("Error updating wallet balances:", error);
        // Fallback to stored wallets
        const storedWallets = getWallets();
        setWallets(storedWallets);
      }
    };
    
    fetchWallets();
  }, []);

  // Mock function to handle row selection
  const handleRowSelect = (index) => {
    if (selectedRows.includes(index)) {
      setSelectedRows(selectedRows.filter(i => i !== index));
    } else {
      setSelectedRows([...selectedRows, index]);
    }
  };

  // Function to handle generating wallets
  const handleGenerateWallets = async (numberOfWallets) => {
    setIsLoading(true);
    
    try {
      // Generate wallets
      const newWallets = await generateWallets(numberOfWallets);
      
      // Update state
      const updatedWallets = [...wallets, ...newWallets];
      setWallets(updatedWallets);
      
      // Close modal
      setShowGenerateModal(false);
      toast.success(`Successfully generated ${numberOfWallets} wallets.`);
    } catch (error) {
      console.error('Error generating wallets:', error);
      toast.error('Failed to generate wallets.');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to handle exporting wallets
  const handleExportWallets = () => {
    try {
      const success = exportWallets();
      if (success) {
        toast.success('Wallets exported successfully.');
      } else {
        toast.error('Failed to export wallets.');
      }
    } catch (error) {
      console.error('Error exporting wallets:', error);
      toast.error('Failed to export wallets.');
    }
  };

  // Function to handle deleting wallet
  const handleDeleteWallet = (publicKey) => {
    try {
      const success = deleteWallet(publicKey);
      if (success) {
        const updatedWallets = wallets.filter(wallet => wallet.publicKey !== publicKey);
        setWallets(updatedWallets);
        toast.success('Wallet deleted successfully.');
      } else {
        toast.error('Failed to delete wallet.');
      }
    } catch (error) {
      console.error('Error deleting wallet:', error);
      toast.error('Failed to delete wallet.');
    }
  };

  // Function to handle check balance
  const handleCheckBalance = async () => {
    try {
      setShowBalanceLoading(true);
      
      // Update all wallet balances
      const updatedWallets = await updateAllWalletBalances();
      setWallets(updatedWallets);
      
      // Show the balances modal
      setShowBalanceLoading(false);
      setShowBalancesModal(true);
      
      toast.success('Wallet balances updated successfully.');
    } catch (error) {
      console.error('Error checking balances:', error);
      setShowBalanceLoading(false);
      toast.error('Failed to check wallet balances.');
    }
  };

  // Function to handle send sol
  const handleSendSol = async (amount, selectedWalletsList) => {
    try {
      setShowBalanceLoading(true);
      
      // If no wallets are selected, use all wallets
      const walletsToUpdate = selectedWalletsList.length > 0 
        ? selectedWalletsList 
        : wallets;
      
      // Extract public keys from wallets
      const walletPublicKeys = walletsToUpdate.map(wallet => wallet.publicKey);
      
      // Send SOL to wallets
      const result = await sendSolToWallets(amount, walletPublicKeys);
      
      if (result.success) {
        // Directly use the updated wallets from the result
        setWallets(result.updatedWallets);
        
        toast.success(`Successfully sent ${amount} SOL to ${walletPublicKeys.length} wallets.`);
        setShowSendSolModal(false);
      } else {
        toast.error('Failed to send SOL to wallets.');
      }
      
      setShowBalanceLoading(false);
    } catch (error) {
      console.error('Error sending SOL:', error);
      setShowBalanceLoading(false);
      toast.error('Failed to send SOL to wallets.');
    }
  };

  // Function to copy to clipboard
  const copyToClipboard = (text) => {
    try {
      navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard!');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast.error('Failed to copy to clipboard.');
    }
  };

  // Function to toggle action menu
  const toggleActionMenu = (index) => {
    if (activeActionMenu === index) {
      setActiveActionMenu(null);
    } else {
      setActiveActionMenu(index);
    }
  };

  const renderWalletsContent = () => {
    if (activeWalletSection === 'create') {
      // Calculate pagination
      const indexOfLastWallet = currentPage * rowsPerPage;
      const indexOfFirstWallet = indexOfLastWallet - rowsPerPage;
      const currentWallets = wallets.slice(indexOfFirstWallet, indexOfLastWallet);
      const totalPages = Math.ceil(wallets.length / rowsPerPage);

      return (
        <div className="section-content">
          <div className="create-wallets-header">
            <div className="create-title">
              <BiCube className="wallet-icon" /> Create Wallets
            </div>
          </div>

          <div className="wallet-container">
            {/* Top Action Buttons */}
            <div className="wallet-actions">
              <button className="action-button" onClick={handleCheckBalance}>
                <MdEmail className="button-icon" /> Check Balance
              </button>
              <button className="action-button" onClick={handleExportWallets}>
                <FaArrowUp className="button-icon" /> Export
              </button>
              <button 
                className="generate-button" 
                onClick={() => setShowGenerateModal(true)}
                disabled={isLoading}
              >
                {isLoading ? 'Generating...' : 'Generate Wallets'}
              </button>
            </div>

            {/* Wallets Table */}
            <div className="wallets-table-container">
              <table className="wallets-list-table">
                <thead>
                  <tr>
                    <th className="checkbox-column">
                      <input 
                        type="checkbox" 
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedRows(wallets.map((_, index) => index));
                          } else {
                            setSelectedRows([]);
                          }
                        }}
                        checked={selectedRows.length === wallets.length && wallets.length > 0}
                      />
                    </th>
                    <th>Address</th>
                    <th>Balance</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {wallets.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="no-results">No wallets created yet.</td>
                    </tr>
                  ) : (
                    currentWallets.map((wallet, index) => (
                      <tr key={index}>
                        <td>
                          <input 
                            type="checkbox" 
                            checked={selectedRows.includes(indexOfFirstWallet + index)}
                            onChange={() => handleRowSelect(indexOfFirstWallet + index)}
                          />
                        </td>
                        <td>{wallet.publicKey}</td>
                        <td>
                          <div className="balance-box">
                            {wallet.balance}
                          </div>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button 
                              className="action-btn copy-btn"
                              onClick={() => copyToClipboard(wallet.publicKey)}
                            >
                              <FaCopy />
                            </button>
                            <button 
                              className="action-btn delete-btn"
                              onClick={() => handleDeleteWallet(wallet.publicKey)}
                            >
                              <FaTrashAlt />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {wallets.length > rowsPerPage && (
              <div className="pagination">
                <button 
                  className="page-button"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  &lt;
                </button>
                
                <span className="page-info">
                  Page {currentPage} of {totalPages}
                </span>
                
                <button 
                  className="page-button"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  &gt;
                </button>
              </div>
            )}

            <div className="bottom-actions">
              <button 
                className="send-sol-button"
                onClick={() => setShowSendSolModal(true)}
                disabled={wallets.length === 0}
              >
                <FaPaperPlane className="button-icon" /> Send Sol To Wallets
              </button>
              <button className="action-button">
                <TbArrowBack className="button-icon" /> Return to Funder Wallet
              </button>
              <button className="action-button">
                <FaExchangeAlt className="button-icon" /> Transfer SPL
              </button>
            </div>
          </div>
          
          <button className="back-button" onClick={() => setActiveWalletSection('main')}>
            {"<"}
          </button>

          {/* Generate Wallets Modal */}
          <GenerateWalletsModal 
            isOpen={showGenerateModal}
            onClose={() => setShowGenerateModal(false)}
            onGenerate={handleGenerateWallets}
          />

          {/* Send Sol Modal */}
          <SendSolModal 
            isOpen={showSendSolModal}
            onClose={() => setShowSendSolModal(false)}
            onSend={handleSendSol}
            selectedWallets={selectedRows.length > 0 
              ? selectedRows.map(index => wallets[index]) 
              : wallets}
            allWallets={wallets}
          />
        </div>
      );
    } else if (activeWalletSection === 'import') {
      return (
        <div className="section-content">
          <h1 className="import-title">Import Your Wallet</h1>
            <p className="import-subtitle">Securely access your Solana wallet using your private key</p>
            
          <div className="wallet-container">
            <div className="secure-import-box">
              <div className="secure-import-header">
                <div className="shield-icon">🛡️</div>
                <div className="secure-text">
                  <h3>Secure Import</h3>
                  <p>Your private key is never stored and is only used to import your wallet</p>
                </div>
              </div>
            </div>
            
            <div className="private-key-section">
              <label>Private Key</label>
              <div className="private-key-input-container">
                <input 
                  type={showPrivateKey ? "text" : "password"}
                  className="private-key-input"
                  placeholder="Enter your private key"
                  value={privateKey}
                  onChange={(e) => setPrivateKey(e.target.value)}
                />
                <button 
                  className="eye-button"
                  onClick={() => setShowPrivateKey(!showPrivateKey)}
                >
                  {showPrivateKey ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
              
              <div className="warning-message">
                <span className="warning-icon">⚠️</span>
                <p>Never share your private key with anyone. We will never ask for it outside of this import screen.</p>
              </div>
            </div>
            
            <button className="import-wallet-button">
              Import Wallet
            </button>
            
            <div className="support-link">
              Need help? <a href="/support">Contact Support</a>
            </div>
          </div>
          <button className="back-button" onClick={() => setActiveWalletSection('main')}>
            {"<"}
          </button>
        </div>
      );
    } else if (activeWalletSection === 'manage') {
      return (
        <div className="section-content">
          {/* Add the header with title and info box */}
          <div className="manage-wallets-header">
            <div className="manage-title">
              <span className="wallet-icon">⚙️</span> Manage Wallets
            </div>
            <div className="wallet-info-box">
              <span className="info-icon">ℹ️</span> Each wallet at least need 0.1 sol in order to use the bundler service.
            </div>
          </div>

          <div className="wallet-management">
            <div className="wallet-header">
              <h1>Wallet Management</h1>
              <p>Manage your wallets.</p>
            </div>

            <div className="wallet-filter">
              <input 
                type="text" 
                placeholder="Filter publicKey..." 
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="filter-input"
              />
              <div className="columns-dropdown">
                <button className="columns-button">
                  Columns <span>▼</span>
                </button>
              </div>
            </div>

            <div className="wallets-table">
              <table>
                <thead>
                  <tr>
                    <th className="checkbox-column">
                      <div className="green-checkbox">
                        <input type="checkbox" id="select-all" />
                        <label htmlFor="select-all"></label>
                      </div>
                    </th>
                    <th>Status</th>
                    <th>Public Key <span className="sort-icon">↕</span></th>
                    <th>Wallet Created Date <span className="sort-icon">↕</span></th>
                    <th>Balance</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {wallets.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="no-results">No results.</td>
                    </tr>
                  ) : (
                    wallets
                      .filter(wallet => wallet.publicKey.includes(filterText))
                      .map((wallet, index) => (
                        <tr key={index}>
                          <td className="checkbox-column">
                            <div className="green-checkbox">
                              <input 
                                type="checkbox" 
                                id={`wallet-${index}`} 
                                checked={selectedRows.includes(index)}
                                onChange={() => handleRowSelect(index)}
                              />
                              <label htmlFor={`wallet-${index}`}></label>
                            </div>
                          </td>
                          <td>
                            <span className={`status ${wallet.status.toLowerCase()}`}>
                              {wallet.status}
                            </span>
                          </td>
                          <td className="public-key-cell">{wallet.publicKey}</td>
                          <td>{new Date(wallet.createdDate).toLocaleDateString()}</td>
                          <td>{wallet.balance}</td>
                          <td>
                            <div className="action-menu-container">
                              <button 
                                className="action-menu-button"
                                onClick={() => toggleActionMenu(index)}
                              >
                                ⋮
                              </button>
                              {activeActionMenu === index && (
                                <div className="action-menu">
                                  <button onClick={() => copyToClipboard(wallet.publicKey)}>
                                    <FaCopy /> Copy Address
                                  </button>
                                  <button onClick={() => handleDeleteWallet(wallet.publicKey)}>
                                    <FaTrashAlt /> Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <button className="back-button" onClick={() => setActiveWalletSection('main')}>
            {"<"}
          </button>
        </div>
      );
    } else if (activeWalletSection === 'advanced') {
      return (
        <div className="section-content">
          <div className="advanced-wallets-header">
          </div>
          
          {/* Add the Advanced Wallet Manager component */}
          <AdvancedWalletManager />
          
          <button className="back-button" onClick={() => setActiveWalletSection('main')}>
            <TbArrowBack />
          </button>
        </div>
      );
    }

    // Main Wallets Section
    return (
      <div className="section-content">
        <div className="section-header">
          <div className="section-title">
            <FaWallet className="section-icon" />
            <h1>Wallets</h1>
          </div>
        </div>

        {/* Wallet Options */}
        <div className="wallet-options">
          <div className="wallet-option-card" onClick={() => setActiveWalletSection('create')}>
            <BiCube className="option-icon" />
            <div className="option-text">
              <h3>Create Wallets</h3>
              <p>Create a 25+ new wallets</p>
            </div>
          </div>
          <div className="wallet-option-card" onClick={() => setActiveWalletSection('import')}>
            <FaDownload className="option-icon" />
            <div className="option-text">
              <h3>Import Wallets</h3>
              <p>Import up to 25 wallets</p>
            </div>
          </div>
          <div className="wallet-option-card" onClick={() => setActiveWalletSection('manage')}>
            <FaCog className="option-icon" />
            <div className="option-text">
              <h3>Manage Wallets</h3>
              <p>Manage your wallets</p>
            </div>
          </div>
          <div className="wallet-option-card" onClick={() => setActiveWalletSection('advanced')}>
            <FaExchangeAlt className="option-icon" />
            <div className="option-text">
              <h3 className="smaller-title">Advanced Management</h3>
              <p>Groups & rotation</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <WalletStats wallets={wallets} />

        {/* Income Chart */}
        <div className="income-chart">
          <IncomeChart />
          <div className="chart-legend">
            <div className="legend-item">
              <span className="legend-color buy"></span>
              <span>buyIncome</span>
            </div>
            <div className="legend-item">
              <span className="legend-color sell"></span>
              <span>sellIncome</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {renderWalletsContent()}
      {showBalanceLoading && <BalanceLoadingScreen />}
      <WalletBalancesModal 
        isOpen={showBalancesModal}
        onClose={() => setShowBalancesModal(false)}
        wallets={wallets}
      />
    </>
  );
};

export default WalletsSection; 