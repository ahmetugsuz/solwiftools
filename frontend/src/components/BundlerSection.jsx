import React, { useState, useEffect, useRef } from 'react';
import { FaPlay, FaWallet, FaCopy, FaTrash, FaPaperPlane, FaTag } from 'react-icons/fa';
import { MdClose, MdOutlineToken } from 'react-icons/md';
import { toast } from 'react-toastify';
import '../styles/BundlerSection.css';
import { bundlerTokens, bundlerWallets, bundlerBundles } from '../services/bundlerApiService';

const BundlerSection = () => {
  console.log('BundlerSection rendered');
  // States for manage launch modal
  const [showManageLaunchModal, setShowManageLaunchModal] = useState(false);
  const [launchDetails, setLaunchDetails] = useState({
    name: '',
    tokenAddress: '',
    tokenImage: null,
    caAddress: '',
    mode: 'Safe',
    experimentalMode: '',
    vanityTokenMint: 'false',
    vanityPattern: '',
    sendingMode: 'jito',
    tokenName: '',
    tokenSymbol: '',
    tokenDescription: '',
    twitter: '',
    telegram: '',
    website: '',
    delay: ''
  });

  // Add new state for image preview
  const [imagePreview, setImagePreview] = useState(null);

  // New states for prepare launch and prepare wallets modals
  const [showPrepareLaunchModal, setShowPrepareLaunchModal] = useState(false);
  const [prepareWalletsList, setPrepareWalletsList] = useState([
    { publicKey: 'HmEFXqLS5ivnyeYgtyPD7kVTLg9RbUuAi3GF8spaciN', balance: '0 SOL' },
    { publicKey: '94GpFmbS6FHiv5NbGWuBdekdSVQE2uSqN189sLZaZJsA', balance: '0 SOL' },
    { publicKey: '6ZtW9ERiHF9d2nA2bc7FUtAiGe6mxzf9MCeGcuvumYuo', balance: '0 SOL' },
    { publicKey: '2cV8CkLJKwwZ86wYJXcT7jgntmTYasRWkvDYUcqcvz71', balance: '0 SOL' },
    { publicKey: 'BsmFZ3VhcAqN17vzd8oPwxREKmJ44eruVuM6wQT48zF', balance: '0 SOL' },
  ]);
  const [selectedWallets, setSelectedWallets] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // New state for tokens
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // New state for wallets
  const [wallets, setWallets] = useState([]);
  const [walletsLoading, setWalletsLoading] = useState(false);

  // New state for bundles
  const [bundles, setBundles] = useState([]);
  const [bundlesLoading, setBundlesLoading] = useState(false);

  // New state for bundled buy modal
  const [showBundledBuyModal, setShowBundledBuyModal] = useState(false);
  const [buyMode, setBuyMode] = useState('immediate');
  const [buyInterval, setBuyInterval] = useState(30); // seconds
  const [selectedBuyWallets, setSelectedBuyWallets] = useState([]);
  const [bundleStatus, setBundleStatus] = useState(null);
  const [bundlePolling, setBundlePolling] = useState(false);
  const bundleIdRef = useRef(null);

  // Add state for prepare launch logs
  const [prepareLogs, setPrepareLogs] = useState([]);
  const [prepareLoading, setPrepareLoading] = useState(false);

  // Add preview state
  const [vanityPreviews, setVanityPreviews] = useState([]);
  const [isGeneratingPreviews, setIsGeneratingPreviews] = useState(false);

  // Fetch tokens on mount
  useEffect(() => {
    const fetchTokens = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await bundlerTokens.getAll();
        setTokens(res.tokens);
      } catch (err) {
        setError('Failed to fetch tokens');
        toast.error('Failed to fetch tokens');
      } finally {
        setLoading(false);
      }
    };
    fetchTokens();
  }, []);

  // Fetch wallets on mount
  useEffect(() => {
    const fetchWallets = async () => {
      setWalletsLoading(true);
      try {
        const res = await bundlerWallets.getAll();
        setWallets(res.wallets);
      } catch (err) {
        toast.error('Failed to fetch wallets');
      } finally {
        setWalletsLoading(false);
      }
    };
    fetchWallets();
  }, []);

  // Fetch bundles on mount
  useEffect(() => {
    const fetchBundles = async () => {
      setBundlesLoading(true);
      try {
        const res = await bundlerBundles.getAll();
        setBundles(res.bundles);
      } catch (err) {
        toast.error('Failed to fetch bundles');
      } finally {
        setBundlesLoading(false);
      }
    };
    fetchBundles();
  }, []);

  // Handle launch modal form changes
  const handleLaunchFormChange = (e) => {
    const { name, value } = e.target;
    setLaunchDetails(prev => ({
      ...prev,
      [name]: value,
      // Reset experimentalMode if mode changes
      ...(name === 'mode' && value !== 'Experimental' ? { experimentalMode: '' } : {})
    }));
  };

  // Handle manage launch modal
  const handleManageLaunchClick = () => {
    setShowManageLaunchModal(true);
  };

  // Handle prepare launch click
  const handlePrepareLaunchClick = () => {
    setShowPrepareLaunchModal(true);
  };

  // Handle wallet selection for the prepare wallets modal
  const handleWalletSelection = (publicKey) => {
    setSelectedWallets(prev => {
      if (prev.includes(publicKey)) {
        return prev.filter(pk => pk !== publicKey);
      } else {
        return [...prev, publicKey];
      }
    });
  };

  // Handle checking balances for wallets
  const handleCheckBalance = () => {
    // Simulate checking balances - in a real app, this would call an API
    toast.info('Checking wallet balances...');
    setTimeout(() => {
      toast.success('Wallet balances updated successfully');
      // Simulate updating balances
      setPrepareWalletsList(prev => prev.map(wallet => ({
        ...wallet,
        balance: `${(Math.random() * 5).toFixed(2)} SOL`
      })));
    }, 1500);
  };

  // Handle closing modals
  const handleClose = () => {
    setShowManageLaunchModal(false);
    setShowPrepareLaunchModal(false);
  };

  // Calculate pagination indices
  const indexOfLastWallet = currentPage * rowsPerPage;
  const indexOfFirstWallet = indexOfLastWallet - rowsPerPage;
  const currentWallets = prepareWalletsList.slice(indexOfFirstWallet, indexOfLastWallet);
  const totalPages = Math.ceil(prepareWalletsList.length / rowsPerPage);

  // Handle pagination navigation
  const handlePageChange = (pageNumber) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  // Handle copying wallet address
  const handleCopyWalletAddress = (address) => {
    navigator.clipboard.writeText(address).then(() => {
      toast.info('Wallet address copied to clipboard');
    });
  };

  // Handle delete wallet
  const handleDeleteWallet = (publicKey) => {
    setPrepareWalletsList(prev => prev.filter(wallet => wallet.publicKey !== publicKey));
    setSelectedWallets(prev => prev.filter(pk => pk !== publicKey));
    toast.success('Wallet removed successfully');
  };

  // Handle send SOL to wallets
  const handleSendSolToWallets = () => {
    if (selectedWallets.length === 0) {
      toast.error('Please select at least one wallet');
      return;
    }

    toast.info(`Sending SOL to ${selectedWallets.length} wallet(s)...`);
    
    // Simulate sending SOL
    setTimeout(() => {
      toast.success('SOL sent successfully to selected wallets');
      setPrepareWalletsList(prev => prev.map(wallet => {
        if (selectedWallets.includes(wallet.publicKey)) {
          return {
            ...wallet,
            balance: '0.1 SOL'
          };
        }
        return wallet;
      }));
      setSelectedWallets([]);
    }, 2000);
  };

  // Handle file upload
  const handleFileUpload = (files) => {
    const file = files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }

      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Image size should be less than 5MB');
        return;
      }

      setLaunchDetails(prev => ({
        ...prev,
        tokenImage: file
      }));

      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle drag and drop
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    handleFileUpload(files);
  };

  // Open bundled buy modal
  const handleOpenBundledBuy = () => {
    setShowBundledBuyModal(true);
    setSelectedBuyWallets(wallets.slice(0, 1)); // default: first wallet
    setBuyMode('immediate');
    setBuyInterval(30);
    setBundleStatus(null);
  };

  // Start bundled buy
  const handleStartBundledBuy = async () => {
    if (selectedBuyWallets.length === 0) {
      toast.error('Select at least one wallet');
      return;
    }
    setBundleStatus({ status: 'pending', wallets: selectedBuyWallets.map(w => ({ ...w, status: 'pending' })) });
    setBundlePolling(true);
    try {
      const res = await bundlerTokens.launch(tokens[0]._id, {
        wallets: selectedBuyWallets,
        buyMode,
        interval: buyMode === 'gradual' ? buyInterval * 1000 : undefined,
        buyAmountSol: 0.01 // or user input
      });
      bundleIdRef.current = res.bundle._id;
      pollBundleStatus(res.bundle._id);
      toast.success('Bundled buy started!');
    } catch (err) {
      setBundlePolling(false);
      toast.error(err.response?.data?.error || 'Failed to start bundled buy');
    }
  };

  // Poll bundle status
  const pollBundleStatus = (bundleId) => {
    const poll = async () => {
      try {
        const res = await bundlerTokens.getBundleStatus(bundleId);
        setBundleStatus(res.bundle);
        if (res.bundle.status === 'executed' || res.bundle.status === 'failed') {
          setBundlePolling(false);
        } else if (bundlePolling) {
          setTimeout(poll, 3000);
        }
      } catch (err) {
        setBundlePolling(false);
        toast.error('Failed to poll bundle status');
      }
    };
    poll();
  };

  // Select/deselect wallets for bundled buy
  const handleSelectBuyWallet = (wallet) => {
    setSelectedBuyWallets(prev =>
      prev.some(w => w._id === wallet._id)
        ? prev.filter(w => w._id !== wallet._id)
        : prev.length < 25 ? [...prev, wallet] : prev
    );
  };

  // Function to start prepare launch and stream logs
  const handlePrepareLaunch = async () => {
    setPrepareLogs([]);
    setPrepareLoading(true);
    // Use the first token (should be selected token in real app)
    const tokenId = tokens[0]?._id;
    if (!tokenId) {
      toast.error('No token selected');
      setPrepareLoading(false);
      return;
    }
    try {
      // Send all launchDetails as POST body
      const response = await fetch(`/api/bundler/tokens/${tokenId}/prepare-launch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(launchDetails)
      });
      const data = await response.json();
      if (!data.prepId) throw new Error('No prepId returned');
      const eventSource = new EventSource(`/api/bundler/tokens/prepare-launch/logs/${data.prepId}`);
      eventSource.onmessage = (event) => {
        setPrepareLogs(prev => [...prev, event.data]);
      };
      eventSource.addEventListener('end', () => {
        setPrepareLoading(false);
        eventSource.close();
        toast.success('Prepare launch complete!');
      });
      eventSource.onerror = () => {
        setPrepareLoading(false);
        eventSource.close();
        toast.error('Error during prepare launch');
      };
    } catch (err) {
      setPrepareLoading(false);
      toast.error('Failed to start prepare launch');
    }
  };

  // Add preview function
  const handlePreviewVanity = async () => {
    if (!launchDetails.vanityPattern) {
      toast.error('Please enter a pattern first');
      return;
    }
    
    setIsGeneratingPreviews(true);
    try {
      const response = await fetch('/api/bundler/preview-vanity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pattern: launchDetails.vanityPattern })
      });
      const data = await response.json();
      if (data.success) {
        setVanityPreviews(data.addresses);
      } else {
        toast.error(data.error || 'Failed to generate previews');
      }
    } catch (error) {
      toast.error('Failed to generate previews');
    } finally {
      setIsGeneratingPreviews(false);
    }
  };

  // Add handler for saving token
  const handleSaveToken = async (e) => {
    console.log('Form submitted!');
    e.preventDefault();
    try {
      let response;
      if (launchDetails._id) {
        // Update existing token
        response = await fetch(`/api/bundler/tokens/${launchDetails._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(launchDetails)
        });
      } else {
        // Create new token
        response = await fetch('/api/bundler/tokens', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(launchDetails)
        });
      }
      const data = await response.json();
      if (data.success) {
        toast.success('Token saved!');
        setShowManageLaunchModal(false);
        // Refresh tokens list
        const res = await bundlerTokens.getAll();
        setTokens(res.tokens);
      } else {
        toast.error(data.error || 'Failed to save token');
      }
    } catch (err) {
      toast.error('Failed to save token');
    }
  };

  // Render logic for loading, error, and empty state
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '60vh',
        width: '100%',
        background: 'transparent',
      }}>
        <div className="bundler-spinner" style={{
          border: '8px solid #f3f3f3',
          borderTop: '8px solid #7c3aed',
          borderRadius: '50%',
          width: 64,
          height: 64,
          animation: 'spin 1s linear infinite'
        }} />
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }
  if (error) {
    return <div style={{ color: 'red', background: 'white', zIndex: 9999, fontSize: 32 }}>{error}</div>;
  }

  return (
    <div className="bundler-container">
      <div className="bundler-header">
        <div className="section-title">
          <MdOutlineToken className="section-icon" />
          <h1>Bundler</h1>
        </div>
      </div>
      <div className="bundler-actions-row main-row">
        <button className="bundler-btn start-btn"><FaPlay /> Start</button>
        <button className="bundler-btn prepare-launch-btn" onClick={handlePrepareLaunchClick}><FaWallet /> Prepare Launch</button>
        <button className="bundler-btn clone-token-btn"><FaCopy /> Clone Token</button>
        <button className="bundler-btn manage-launch-btn" onClick={handleManageLaunchClick}><FaPaperPlane /> Manage Launch</button>
      </div>
      <div className="bundler-actions-row secondary-row">
        <button className="bundler-btn dump-all-btn"><FaTrash /> Dump All</button>
        <button className="bundler-btn dump-all-percent-btn"><FaTrash /> Dump All %</button>
        <button className="bundler-btn single-sell-btn"><FaTag /> Single Sell</button>
        <button className="bundler-btn holder-count-btn"><FaWallet /> Holder Count</button>
        <button className="bundler-btn dev-sell-btn"><FaTrash /> Dev Sell</button>
        <button className="bundler-btn send-spl-btn"><FaPlay /> Send SPL</button>
        <button className="bundler-btn drop-bundle-btn"><FaPaperPlane /> Drop Bundle</button>
      </div>
      {/* Token Info Table and Analytics Section */}
      <div className="token-info-table">
        <div className="table-header">
          <div className="header-cell">Mode</div>
          <div className="header-cell">Sending Mode</div>
          <div className="header-cell">Delay</div>
          <div className="header-cell">Name</div>
          <div className="header-cell">Symbol</div>
          <div className="header-cell">Vanity</div>
          <div className="header-cell">Twitter</div>
          <div className="header-cell">Telegram</div>
          <div className="header-cell">Website</div>
        </div>
        {tokens.map(token => (
          <div className="table-row" key={token._id}>
            <div className="cell">Experimental</div>
            <div className="cell">{token.sendingMode || 'jito'}</div>
            <div className="cell">-</div>
            <div className="cell">{token.name}</div>
            <div className="cell">{token.symbol}</div>
            <div className="cell">{token.vanity ? 'true' : 'false'}</div>
            <div className="cell">{token.twitterLink}</div>
            <div className="cell">{token.telegramLink}</div>
            <div className="cell">{token.websiteLink}</div>
          </div>
        ))}
      </div>

      {/* Manage Launch Modal */}
      {showManageLaunchModal && (
        <div className="modal-backdrop">
          <div className="manage-launch-modal">
            <div className="modal-header">
              <h2>Manage Launch Token</h2>
              <button className="close-button" onClick={handleClose}>
                <MdClose />
              </button>
            </div>
            <div className="modal-content">
              <form className="form-grid improved-form-grid" onSubmit={handleSaveToken}>
                {/* Mode Dropdown */}
                <div className="form-group">
                  <select
                    id="mode"
                    name="mode"
                    value={launchDetails.mode}
                    onChange={handleLaunchFormChange}
                    required
                  >
                    <option value="Safe">Safe</option>
                    <option value="Experimental">Experimental</option>
                  </select>
                  <label htmlFor="mode">Mode</label>
                </div>
                {/* Sending Mode Dropdown */}
                <div className="form-group">
                  <select 
                    id="sendingMode" 
                    name="sendingMode" 
                    value={launchDetails.sendingMode}
                    onChange={handleLaunchFormChange}
                    className="w-full p-2 border rounded bg-gray-800 text-white"
                    required
                  >
                    <option value="jito">Jito</option>
                    <option value="rpc">RPC</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="bloxroute">Bloxroute</option>
                  </select>
                  <label htmlFor="sendingMode">Sending Mode</label>
                </div>
                {/* Experimental Mode Dropdown (conditional) */}
                {launchDetails.mode === 'Experimental' && (
                  <div className="form-group full-width">
                  <select 
                      id="experimentalMode"
                      name="experimentalMode"
                      value={launchDetails.experimentalMode}
                      onChange={handleLaunchFormChange}
                    required
                  >
                      <option value="On-Demand">On-Demand</option>
                      <option value="Regular">Regular</option>
                  </select>
                    <label htmlFor="experimentalMode">Experimental Mode</label>
                  </div>
                )}
                {/* Delay input (full-width) if needed */}
                {launchDetails.mode === 'Experimental' && launchDetails.experimentalMode === 'Regular' && (
                  <div className="form-group full-width">
                    <input
                      id="delay"
                      name="delay"
                      type="number"
                      placeholder="Delay (ms)"
                      value={launchDetails.delay}
                      onChange={handleLaunchFormChange}
                      min={0}
                      required
                    />
                    <label htmlFor="delay">Delay (ms)</label>
                </div>
                )}
                {/* Token Name */}
                <div className="form-group">
                  <input 
                    id="tokenName" 
                    name="tokenName" 
                    type="text" 
                    placeholder="Token Name"
                    value={launchDetails.tokenName}
                    onChange={handleLaunchFormChange}
                    required
                  />
                  <label htmlFor="tokenName">Token Name</label>
                </div>
                {/* Token Symbol */}
                <div className="form-group">
                  <input 
                    id="tokenSymbol" 
                    name="tokenSymbol" 
                    type="text" 
                    placeholder="Token Symbol"
                    value={launchDetails.tokenSymbol}
                    onChange={handleLaunchFormChange}
                    required
                  />
                  <label htmlFor="tokenSymbol">Token Symbol</label>
                </div>
                {/* Token Description (full-width, single-line input) */}
                <div className="form-group full-width">
                  <input
                    id="tokenDescription"
                    name="tokenDescription"
                    type="text"
                    placeholder="Token Description"
                    value={launchDetails.tokenDescription || ''}
                    onChange={handleLaunchFormChange}
                    required
                  />
                  <label htmlFor="tokenDescription">Token Description</label>
                </div>
                {/* Twitter */}
                <div className="form-group">
                  <input 
                    id="twitter"
                    name="twitter"
                    type="text" 
                    placeholder="Twitter"
                    value={launchDetails.twitter}
                    onChange={handleLaunchFormChange}
                  />
                  <label htmlFor="twitter">Twitter</label>
                </div>
                {/* Telegram */}
                <div className="form-group">
                  <input 
                    id="telegram"
                    name="telegram"
                    type="text" 
                    placeholder="Telegram"
                    value={launchDetails.telegram}
                    onChange={handleLaunchFormChange}
                  />
                  <label htmlFor="telegram">Telegram</label>
                </div>
                {/* Website */}
                <div className="form-group">
                  <input 
                    id="website"
                    name="website"
                    type="text" 
                    placeholder="Website"
                    value={launchDetails.website}
                    onChange={handleLaunchFormChange}
                  />
                  <label htmlFor="website">Website</label>
                </div>
                {/* Vanity Token Mint Dropdown */}
                <div className="form-group">
                  <select
                    id="vanityTokenMint"
                    name="vanityTokenMint"
                    value={launchDetails.vanityTokenMint}
                    onChange={handleLaunchFormChange}
                    required
                  >
                    <option value="true">true</option>
                    <option value="false">false</option>
                  </select>
                  <label htmlFor="vanityTokenMint">Vanity Token Mint</label>
                </div>
                {/* Upload Image */}
                <div className="form-group full-width">
                  <label>Upload Image</label>
                  <div 
                    className="upload-area"
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('tokenImage').click()}
                  >
                    {imagePreview ? (
                      <div className="image-preview">
                        <img src={imagePreview} alt="Token preview" />
                        <p>Click or drag to change image</p>
                      </div>
                    ) : (
                      <p>Click or drag and drop image here</p>
                    )}
                    <input
                      id="tokenImage"
                      name="tokenImage"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e.target.files)}
                      hidden
                    />
                  </div>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button className="modal-button cancel-button" onClick={handleClose} type="button">
                Cancel
              </button>
              <button className="modal-button test-submit-button" type="submit">
                Test Submit
              </button>
              <button className="modal-button continue-button" type="submit">
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Prepare Launch Modal */}
      {showPrepareLaunchModal && (
        <div className="modal-backdrop">
          <div className="prepare-launch-modal">
            <div className="modal-header">
              <h2>Prepare Launch</h2>
              <button className="close-button" onClick={handleClose}>
                <MdClose />
              </button>
            </div>
            <div className="modal-content">
              {/* Only show Prepare button and log terminal, remove form fields */}
              <div style={{marginTop: 24}}>
                <button className="prepare-button" onClick={handlePrepareLaunch} disabled={prepareLoading}>
                  {prepareLoading ? 'Preparing...' : 'Prepare'}
                </button>
              </div>
              <div style={{background: '#181818', color: '#0f0', fontFamily: 'monospace', marginTop: 24, minHeight: 120, borderRadius: 8, padding: 16, maxHeight: 240, overflowY: 'auto'}}>
                {prepareLogs.length === 0 && <span style={{color: '#888'}}>No logs yet.</span>}
                {prepareLogs.map((log, i) => <div key={i}>{log}</div>)}
              </div>
            </div>
            <div className="modal-buttons">
              <button className="cancel-button" onClick={handleClose}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bundled Buy Modal */}
      {showBundledBuyModal && (
        <div className="modal-backdrop">
          <div className="manage-launch-modal">
            <div className="modal-header">
              <h2>Bundled Buy Options</h2>
              <button className="close-button" onClick={() => setShowBundledBuyModal(false)}>
                <MdClose />
              </button>
            </div>
            <div className="modal-content">
              <div>
                <label>Buy Mode:</label>
                <label><input type="radio" checked={buyMode === 'immediate'} onChange={() => setBuyMode('immediate')} /> Immediate</label>
                <label><input type="radio" checked={buyMode === 'gradual'} onChange={() => setBuyMode('gradual')} /> Gradual</label>
                {buyMode === 'gradual' && (
                  <input type="number" min={5} max={600} value={buyInterval} onChange={e => setBuyInterval(Number(e.target.value))} />
                )}
                <span>{buyMode === 'gradual' ? 'Interval (seconds)' : null}</span>
              </div>
              <div>
                <label>Select Wallets (up to 25):</label>
                <ul>
                  {wallets.map(wallet => (
                    <li key={wallet._id}>
                      <input
                        type="checkbox"
                        checked={selectedBuyWallets.some(w => w._id === wallet._id)}
                        onChange={() => handleSelectBuyWallet(wallet)}
                        disabled={selectedBuyWallets.length >= 25 && !selectedBuyWallets.some(w => w._id === wallet._id)}
                      />
                      {wallet.publicKey} (Balance: {wallet.balance})
                    </li>
                  ))}
                </ul>
              </div>
              <button className="modal-button continue-button" onClick={handleStartBundledBuy} disabled={bundlePolling}>
                Start Bundled Buy
              </button>
            </div>
            <div className="modal-footer">
              <button className="modal-button cancel-button" onClick={() => setShowBundledBuyModal(false)}>
                Cancel
              </button>
            </div>
            {/* Progress/status */}
            {bundleStatus && (
              <div className="bundle-status">
                <h4>Status: {bundleStatus.status}</h4>
                <ul>
                  {bundleStatus.wallets.map((w, i) => (
                    <li key={i}>
                      Wallet: {w.publicKey} - {w.status}
                      {w.tx && w.tx.signature && (
                        <a href={`https://solscan.io/tx/${w.tx.signature}`} target="_blank" rel="noopener noreferrer">View Tx</a>
                      )}
                    </li>
                  ))}
                </ul>
                {bundleStatus.error && <div className="error">Error: {bundleStatus.error}</div>}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tokens List */}
      {loading && <div>Loading tokens...</div>}
      <ul>
        {tokens.map(token => (
          <li key={token._id}>{token.name} ({token.symbol})</li>
        ))}
      </ul>

      {/* Wallets List */}
      {walletsLoading && <div>Loading wallets...</div>}
      <ul>
        {wallets.map(wallet => (
          <li key={wallet._id}>{wallet.publicKey} (Balance: {wallet.balance})</li>
        ))}
      </ul>

      {/* Bundles List */}
      {bundlesLoading && <div>Loading bundles...</div>}
      <ul>
        {bundles.map(bundle => (
          <li key={bundle._id}>Bundle for token: {bundle.token} (Status: {bundle.status})</li>
        ))}
      </ul>
    </div>
  );
};

export default BundlerSection; 