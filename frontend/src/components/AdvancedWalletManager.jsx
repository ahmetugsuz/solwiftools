import React, { useState, useEffect } from 'react';
import { 
  FaWallet, 
  FaUserFriends, 
  FaChartLine, 
  FaRandom, 
  FaHistory, 
  FaTags, 
  FaPlus, 
  FaAngleDown, 
  FaEdit, 
  FaTrashAlt,
  FaExchangeAlt,
  FaCog,
  FaSync,
  FaRedo
} from 'react-icons/fa';
import { 
  getWallets, 
  getWalletGroups, 
  addOrUpdateWalletGroup, 
  deleteWalletGroup,
  moveWalletsToGroup,
  getNextWalletInRotation,
  updateGroupRotationSettings,
  getWalletAnalytics,
  generateRandomActivity,
  updateAllWalletBalances,
  updateWalletTags
} from '../services/walletService';
import '../styles/AdvancedWalletManager.css';

const AdvancedWalletManager = () => {
  // States for wallet groups and management
  const [wallets, setWallets] = useState([]);
  const [walletGroups, setWalletGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedWallets, setSelectedWallets] = useState([]);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [showRotationSettingsModal, setShowRotationSettingsModal] = useState(false);
  const [rotationSettings, setRotationSettings] = useState({
    rotationStrategy: 'sequential',
    rotationEnabled: false,
    rotationInterval: 24,
    activityPattern: 'natural'
  });
  const [showTagsModal, setShowTagsModal] = useState(false);
  const [taggedWallet, setTaggedWallet] = useState(null);
  const [walletTags, setWalletTags] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [walletAnalytics, setWalletAnalytics] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Load wallets and groups on component mount
  useEffect(() => {
    loadWalletsAndGroups();
  }, []);
  
  // When selected group changes, update analytics
  useEffect(() => {
    if (selectedGroup) {
      const analytics = getWalletAnalytics(selectedGroup);
      setWalletAnalytics(analytics);
    } else {
      const analytics = getWalletAnalytics();
      setWalletAnalytics(analytics);
    }
  }, [selectedGroup, wallets]);
  
  // Load all wallets and wallet groups
  const loadWalletsAndGroups = async () => {
    setIsUpdating(true);
    try {
      // Get updated wallets with balances
      const updatedWallets = await updateAllWalletBalances();
      setWallets(updatedWallets);
      
      // Get all wallet groups
      const groups = getWalletGroups();
      setWalletGroups(groups);
      
      // If no groups exist yet, create a default group
      if (groups.length === 0) {
        const defaultGroup = {
          name: 'Default',
          createdDate: new Date().toISOString(),
          walletCount: updatedWallets.length,
          rotationStrategy: 'sequential',
          rotationEnabled: false,
          rotationInterval: 24,
          activityPattern: 'natural'
        };
        
        addOrUpdateWalletGroup('Default', defaultGroup);
        setWalletGroups([defaultGroup]);
      }
      
      // Set selected group to Default if none selected
      if (!selectedGroup && groups.length > 0) {
        setSelectedGroup(groups[0].name);
      }
    } catch (error) {
      console.error("Error loading wallets and groups:", error);
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Handle creating a new wallet group
  const handleCreateGroup = () => {
    if (!newGroupName.trim()) return;
    
    const newGroup = {
      name: newGroupName,
      createdDate: new Date().toISOString(),
      walletCount: 0,
      rotationStrategy: 'sequential',
      rotationEnabled: false,
      rotationInterval: 24,
      activityPattern: 'natural'
    };
    
    addOrUpdateWalletGroup(newGroupName, newGroup);
    
    // Update state
    setWalletGroups([...walletGroups, newGroup]);
    setSelectedGroup(newGroupName);
    setShowCreateGroupModal(false);
    setNewGroupName('');
  };
  
  // Handle deleting a wallet group
  const handleDeleteGroup = (groupName) => {
    // Skip confirmation dialogs
    deleteWalletGroup(groupName, false); // Keep wallets and move to Default group
    
    // Update state
    const updatedGroups = walletGroups.filter(g => g.name !== groupName);
    setWalletGroups(updatedGroups);
    
    // If the deleted group was selected, select Default group
    if (selectedGroup === groupName) {
      setSelectedGroup(updatedGroups.length > 0 ? updatedGroups[0].name : null);
    }
    
    // Reload wallets
    loadWalletsAndGroups();
  };
  
  // Handle moving selected wallets to a different group
  const handleMoveWallets = (targetGroup) => {
    if (selectedWallets.length === 0) return;
    
    moveWalletsToGroup(selectedWallets, targetGroup);
    
    // Reload wallets and deselect wallets
    loadWalletsAndGroups();
    setSelectedWallets([]);
  };
  
  // Handle selecting a wallet
  const handleSelectWallet = (publicKey) => {
    if (selectedWallets.includes(publicKey)) {
      setSelectedWallets(selectedWallets.filter(pk => pk !== publicKey));
    } else {
      setSelectedWallets([...selectedWallets, publicKey]);
    }
  };
  
  // Handle selecting all wallets in the current view
  const handleSelectAllWallets = () => {
    if (selectedWallets.length === getFilteredWallets().length) {
      // If all wallets are selected, deselect all
      setSelectedWallets([]);
    } else {
      // Otherwise select all wallets
      setSelectedWallets(getFilteredWallets().map(w => w.publicKey));
    }
  };
  
  // Get wallets filtered by the selected group
  const getFilteredWallets = () => {
    if (!selectedGroup) return wallets;
    return wallets.filter(wallet => wallet.group === selectedGroup);
  };
  
  // Get the next wallet in rotation
  const handleGetNextWallet = () => {
    if (!selectedGroup) return;
    
    const nextWallet = getNextWalletInRotation(selectedGroup);
    
    if (nextWallet) {
      // Select this wallet
      setSelectedWallets([nextWallet.publicKey]);
      
      // Reload wallets to get updated data
      loadWalletsAndGroups();
      
      return nextWallet;
    }
    
    return null;
  };
  
  // Save rotation settings for the selected group
  const handleSaveRotationSettings = () => {
    if (!selectedGroup) return;
    
    updateGroupRotationSettings(selectedGroup, rotationSettings);
    
    // Update groups state
    const updatedGroups = walletGroups.map(group => {
      if (group.name === selectedGroup) {
        return { ...group, ...rotationSettings };
      }
      return group;
    });
    
    setWalletGroups(updatedGroups);
    setShowRotationSettingsModal(false);
  };
  
  // Generate random activity for the selected group
  const handleGenerateActivity = () => {
    if (!selectedGroup) return;
    
    generateRandomActivity(selectedGroup);
    
    // Reload wallets to get updated data
    loadWalletsAndGroups();
  };
  
  // Save tags for the wallet
  const handleSaveTags = () => {
    if (!taggedWallet) return;
    
    updateWalletTags(taggedWallet.publicKey, walletTags);
    
    // Reload wallets
    loadWalletsAndGroups();
    setShowTagsModal(false);
    setTaggedWallet(null);
  };
  
  // Open the tags modal for a specific wallet
  const handleOpenTagsModal = (wallet) => {
    setTaggedWallet(wallet);
    setWalletTags(wallet.tags || []);
    setShowTagsModal(true);
  };
  
  // Add a new tag to the wallet
  const handleAddTag = () => {
    if (!newTag.trim()) return;
    
    setWalletTags([...walletTags, newTag]);
    setNewTag('');
  };
  
  // Remove a tag from the wallet
  const handleRemoveTag = (tag) => {
    setWalletTags(walletTags.filter(t => t !== tag));
  };
  
  return (
    <div className="advanced-wallet-manager">
      <div className="wallet-manager-header">
        <div className="wallet-manager-title">
          <FaWallet className="wallet-icon" />
          <h2>Advanced Wallet Control Center</h2>
        </div>
        <div className="wallet-manager-actions">
          <button 
            className="refresh-button" 
            onClick={loadWalletsAndGroups}
            disabled={isUpdating}
            title="Refresh Wallets"
          >
            {isUpdating ? <FaSync className="spin" /> : <span>↻</span>}
          </button>
        </div>
      </div>
      
      <div className="wallet-manager-grid">
        {/* Left sidebar - Groups */}
        <div className="wallet-sidebar">
          <div className="sidebar-header">
            <h3>Wallet Groups</h3>
            <button 
              className="create-group-button" 
              onClick={() => setShowCreateGroupModal(true)}
              title="Create new group"
            >
              <span>+</span>
            </button>
          </div>
          
          <div className="wallet-groups-list">
            {walletGroups.map(group => (
              <div 
                key={group.name}
                className={`wallet-group-item ${selectedGroup === group.name ? 'active' : ''}`}
                onClick={() => setSelectedGroup(group.name)}
              >
                <div className="group-info">
                  <span className="group-name">{group.name}</span>
                  <span className="group-count">{group.walletCount}</span>
                </div>
                <div className="group-actions">
                  <button 
                    className="group-action-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteGroup(group.name);
                    }}
                  >
                    <span>🗑️</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {/* Group Management Tools */}
          {selectedGroup && (
            <div className="group-management">
              <div className="management-header">
                <h3>Group Tools</h3>
              </div>
              
              <div className="management-tools">
                <button 
                  className="tool-button"
                  onClick={() => {
                    // Get current group settings
                    const group = walletGroups.find(g => g.name === selectedGroup);
                    if (group) {
                      setRotationSettings({
                        rotationStrategy: group.rotationStrategy || 'sequential',
                        rotationEnabled: group.rotationEnabled || false,
                        rotationInterval: group.rotationInterval || 24,
                        activityPattern: group.activityPattern || 'natural'
                      });
                      setShowRotationSettingsModal(true);
                    }
                  }}
                >
                  <span>⚙️</span> <span>Rotation Settings</span>
                </button>
                
                <button 
                  className="tool-button"
                  onClick={handleGetNextWallet}
                >
                  <span>🔄</span> <span>Get Next Wallet</span>
                </button>
                
                <button 
                  className="tool-button"
                  onClick={handleGenerateActivity}
                >
                  <span>📊</span> <span>Generate Activity</span>
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Main content - Wallets Table */}
        <div className="wallet-content">
          <div className="wallet-table-header">
            <h3>{selectedGroup ? `${selectedGroup} Wallets` : 'All Wallets'}</h3>
            
            {selectedWallets.length > 0 && (
              <div className="selection-actions">
                <span className="selected-count">{selectedWallets.length} selected</span>
                <div className="selection-dropdown">
                  <button className="move-button">
                    Move To <span>▼</span>
                  </button>
                  <div className="move-dropdown">
                    {walletGroups.map(group => (
                      <button 
                        key={group.name}
                        onClick={() => handleMoveWallets(group.name)}
                        className="move-option"
                      >
                        {group.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="smart-wallets-table">
            <table>
              <thead>
                <tr>
                  <th className="checkbox-column">
                    <input 
                      type="checkbox" 
                      checked={
                        selectedWallets.length === getFilteredWallets().length && 
                        getFilteredWallets().length > 0
                      }
                      onChange={handleSelectAllWallets}
                    />
                  </th>
                  <th>Address</th>
                  <th>Balance</th>
                  <th>Group</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {getFilteredWallets().length === 0 ? (
                  <tr>
                    <td colSpan="5" className="no-results">No wallets in this group</td>
                  </tr>
                ) : (
                  getFilteredWallets().map(wallet => (
                    <tr 
                      key={wallet.publicKey}
                      className={selectedWallets.includes(wallet.publicKey) ? 'selected-row' : ''}
                    >
                      <td>
                        <input 
                          type="checkbox"
                          checked={selectedWallets.includes(wallet.publicKey)}
                          onChange={() => handleSelectWallet(wallet.publicKey)}
                        />
                      </td>
                      <td className="wallet-address">
                        {wallet.publicKey.slice(0, 8)}...{wallet.publicKey.slice(-6)}
                      </td>
                      <td>
                        <div className="balance-box">
                          {wallet.balance} SOL
                        </div>
                      </td>
                      <td>{wallet.group || 'Default'}</td>
                      <td className="wallet-actions">
                        <button 
                          className="wallet-action-btn"
                          title="Manage Tags"
                          onClick={() => handleOpenTagsModal(wallet)}
                        >
                          <span>🏷️</span>
                        </button>
                        <button 
                          className="wallet-action-btn" 
                          title="View Activity"
                        >
                          <span>📈</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Right sidebar - Analytics */}
        <div className="analytics-sidebar">
          <div className="analytics-header">
            <h3>Wallet Analytics</h3>
          </div>
          
          {walletAnalytics ? (
            <div className="analytics-content">
              <div className="analytics-stat">
                <span className="stat-label">Total Wallets</span>
                <span className="stat-value">{walletAnalytics.totalWallets}</span>
              </div>
              
              <div className="analytics-stat">
                <span className="stat-label">Total Balance</span>
                <span className="stat-value">{walletAnalytics.totalBalance} SOL</span>
              </div>
              
              <div className="analytics-stat">
                <span className="stat-label">Average Balance</span>
                <span className="stat-value">{walletAnalytics.avgBalance} SOL</span>
              </div>
              
              <div className="analytics-stat">
                <span className="stat-label">Active Wallets (7d)</span>
                <span className="stat-value">{walletAnalytics.activeWallets}</span>
              </div>
              
              <div className="analytics-stat">
                <span className="stat-label">Total Activity</span>
                <span className="stat-value">{walletAnalytics.totalActivity}</span>
              </div>
            </div>
          ) : (
            <div className="analytics-content">
              <div className="no-results">Loading analytics...</div>
            </div>
          )}
        </div>
      </div>
      
      {/* Create Group Modal */}
      {showCreateGroupModal && (
        <div className="wallet-modal-backdrop">
          <div className="wallet-modal">
            <div className="wallet-modal-header">
              <h3>Create Wallet Group</h3>
              <button 
                className="close-modal-button"
                onClick={() => {
                  setShowCreateGroupModal(false);
                  setNewGroupName('');
                }}
              >
                &times;
              </button>
            </div>
            
            <div className="wallet-modal-content">
              <div className="form-group">
                <label>Group Name</label>
                <input 
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Enter group name"
                />
              </div>
            </div>
            
            <div className="wallet-modal-footer">
              <button 
                className="cancel-button"
                onClick={() => {
                  setShowCreateGroupModal(false);
                  setNewGroupName('');
                }}
              >
                Cancel
              </button>
              <button 
                className="create-button"
                onClick={handleCreateGroup}
                disabled={!newGroupName.trim()}
              >
                Create Group
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Rotation Settings Modal */}
      {showRotationSettingsModal && (
        <div className="wallet-modal-backdrop">
          <div className="wallet-modal rotation-settings">
            <div className="wallet-modal-header">
              <h3>Rotation Settings - {selectedGroup}</h3>
              <button 
                className="close-modal-button"
                onClick={() => setShowRotationSettingsModal(false)}
              >
                &times;
              </button>
            </div>
            
            <div className="wallet-modal-content">
              <div className="form-group">
                <label>Rotation Strategy</label>
                <select 
                  value={rotationSettings.rotationStrategy}
                  onChange={(e) => setRotationSettings({
                    ...rotationSettings,
                    rotationStrategy: e.target.value
                  })}
                >
                  <option value="sequential">Sequential (Round Robin)</option>
                  <option value="random">Random</option>
                  <option value="balance">Balance-Based (Highest First)</option>
                  <option value="activity">Activity-Based (Least Recent)</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Rotation Interval (hours)</label>
                <input 
                  type="number"
                  value={rotationSettings.rotationInterval}
                  onChange={(e) => setRotationSettings({
                    ...rotationSettings,
                    rotationInterval: parseInt(e.target.value) || 24
                  })}
                  min="1"
                  max="168"
                />
              </div>
              
              <div className="form-group">
                <label>Activity Pattern</label>
                <select 
                  value={rotationSettings.activityPattern}
                  onChange={(e) => setRotationSettings({
                    ...rotationSettings,
                    activityPattern: e.target.value
                  })}
                >
                  <option value="natural">Natural (1-3 tx/day)</option>
                  <option value="random">Random (3-8 tx/day)</option>
                  <option value="aggressive">Aggressive (8-15 tx/day)</option>
                </select>
              </div>
            </div>
            
            <div className="wallet-modal-footer">
              <div className="toggle-container">
                <label className="rotation-toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={rotationSettings.rotationEnabled}
                    onChange={() => setRotationSettings({
                      ...rotationSettings,
                      rotationEnabled: !rotationSettings.rotationEnabled
                    })}
                  />
                  <span className="rotation-toggle-slider"></span>
                </label>
                <span className="rotation-toggle-label">
                  {rotationSettings.rotationEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <div className="button-group">
                <button 
                  className="cancel-button"
                  onClick={() => setShowRotationSettingsModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="save-button"
                  onClick={handleSaveRotationSettings}
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Wallet Tags Modal */}
      {showTagsModal && taggedWallet && (
        <div className="wallet-modal-backdrop">
          <div className="wallet-modal">
            <div className="wallet-modal-header">
              <h3>Manage Tags</h3>
              <button 
                className="close-modal-button"
                onClick={() => {
                  setShowTagsModal(false);
                  setTaggedWallet(null);
                }}
              >
                &times;
              </button>
            </div>
            
            <div className="wallet-modal-content">
              <div className="wallet-details">
                <span className="wallet-address-label">Wallet:</span>
                <span className="wallet-address-value">
                  {taggedWallet.publicKey.slice(0, 8)}...{taggedWallet.publicKey.slice(-6)}
                </span>
              </div>
              
              <div className="tags-input-container">
                <div className="tags-input">
                  <input 
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add new tag"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleAddTag();
                      }
                    }}
                  />
                  <button 
                    className="add-tag-button"
                    onClick={handleAddTag}
                    disabled={!newTag.trim()}
                  >
                    <FaPlus />
                  </button>
                </div>
              </div>
              
              <div className="tags-list">
                {walletTags.length > 0 ? (
                  walletTags.map(tag => (
                    <div key={tag} className="tag-item">
                      <span className="tag-text">{tag}</span>
                      <button 
                        className="remove-tag-button"
                        onClick={() => handleRemoveTag(tag)}
                      >
                        &times;
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="no-tags-message">
                    No tags added yet. Tags help you organize and categorize your wallets.
                  </div>
                )}
              </div>
            </div>
            
            <div className="wallet-modal-footer">
              <button 
                className="cancel-button"
                onClick={() => {
                  setShowTagsModal(false);
                  setTaggedWallet(null);
                }}
              >
                Cancel
              </button>
              <button 
                className="save-button"
                onClick={handleSaveTags}
              >
                Save Tags
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedWalletManager;