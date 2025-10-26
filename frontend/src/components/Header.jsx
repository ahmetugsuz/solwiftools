import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom'; // Import useLocation and useNavigate from react-router-dom
import '../styles/Header.css'; // Import your custom CSS for styling
import ActiveLink from './ActiveLink';
import logo from '../assets/logo.svg';
import { toast } from 'react-toastify';

const Header = ({ setShowLoginModal, handleWalletLogin, walletAddress }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [copied, setCopied] = useState(false);
  const location = useLocation(); // Get the current location (route)
  const navigate = useNavigate(); // Add navigate for SPA navigation

  /*
  useEffect(() => {
    // Check for existing connection on component mount
    const checkWalletConnection = async () => {
      if (window.solana && window.solana.isPhantom) {
        try {
          if (localStorage.getItem('walletAddress')) {
            const response = await window.solana.connect({ onlyIfTrusted: true });
            setWalletAddress(response.publicKey.toString());
          }
        } catch (error) {
          console.error('Wallet reconnection error:', error);
          localStorage.removeItem('walletAddress');
        }
      }
    };

    checkWalletConnection();
  }, []);
  */

  useEffect(() => {
    const handleWalletConnection = (event) => {
      const address = event.detail?.address;
      if (address) {
        localStorage.setItem('walletAddress', address);
      }
    };
    

    const handleWalletDisconnection = () => {

      setShowDropdown(false);
      localStorage.removeItem('walletAddress');
    };

    window.addEventListener('walletConnected', handleWalletConnection);
    window.addEventListener('walletDisconnected', handleWalletDisconnection);

    return () => {
      window.removeEventListener('walletConnected', handleWalletConnection);
      window.removeEventListener('walletDisconnected', handleWalletDisconnection);
    };
  }, []);

  // Connect wallet function
  const connectWallet = async () => {
    try {
      if (!window.solana || !window.solana.isPhantom) {
        alert('Please install Phantom wallet extension.');
        throw new Error('Phantom wallet not found');
      }
  
      let address;
  
      // If already connected, use publicKey directly
      if (window.solana.publicKey) {
        address = window.solana.publicKey.toString();
      } else {
        const response = await window.solana.connect();
        address = response?.publicKey?.toString();
      }
  
      if (!address) {
        throw new Error('Wallet address not available');
      }
  
      localStorage.setItem('walletAddress', address);
      window.dispatchEvent(new CustomEvent('walletConnected', {
        detail: { address }
      }));
  
      return address;
    } catch (error) {
      console.error('Error connecting to Phantom wallet:', error);
      return null;
    }
  };
  

  // Disconnect wallet function
  const disconnectWallet = () => {
    if (window.solana?.isPhantom) {
      if (typeof window.solana.disconnect === 'function') {
        window.solana.disconnect();
      }
      setShowDropdown(false);
      localStorage.removeItem('walletAddress');
      window.dispatchEvent(new CustomEvent('walletDisconnected'));
      console.log('Wallet disconnected');
    }
  };
  

  // Copy wallet address to clipboard
  const copyAddress = () => {
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    
    // Reset "Copied" text after 2 seconds
    setTimeout(() => {
      setCopied(false);
    }, 1000);
  };

  // Change wallet function
  const changeWallet = async () => {
    disconnectWallet();
    setTimeout(() => {
      handleWalletLogin();
    }, 500);
  };

  // Toggle dropdown
  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  // Format wallet address for display
  const formatWalletAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 4)}..${address.substring(address.length - 4)}`;
  };

  return (
    <header className="header">
      {/* Logo and Text */}
      <div className="logo">
        <Link to="/" className="logo-link">
          <img src={logo} alt="SolWifTools" className="logo-image" />
          <span className="logo-text">SolWifTools</span>
        </Link>
      </div>

      {/* Navigation Menu */}
      <nav className="nav">
        <Link
          to="/"
          className={`nav-link ${location.pathname === '/' ? 'active-link' : ''}`}
        >
          Home
        </Link>
        <div className="nav-link token-menu">
          Token
          <div className="token-dropdown">
            <Link to="/Create-Token" className="dropdown-link">Create Token</Link>
            <Link to="/Your-Tokens" className="dropdown-link">Your Tokens</Link>
          </div>
        </div>
        <Link
          to="/liquidity"
          className={`nav-link ${location.pathname === '/liquidity' ? 'active-link' : ''}`}
        >
          Liquidity
        </Link>
        <Link
          to="/Products"
          className={`nav-link ${location.pathname === '/Products' ? 'active-link' : ''}`}
        >
          Products
        </Link>
        <Link
          to="#"
          className={`nav-link ${location.pathname === '/Dashboard' ? 'active-link' : ''}`}
          onClick={async e => {
            e.preventDefault();
            const jwt = localStorage.getItem('jwt');
            const wallet = localStorage.getItem('walletAddress');
            if (!jwt || !wallet) {
              setShowLoginModal(true);
              return;
            }
            try {
              const response = await fetch('/api/license/dashboard/access', {
                headers: { Authorization: `Bearer ${jwt}` }
              });
              const data = await response.json();
              if (data.hasAccess) {
                navigate('/dashboard');
              } else {
                toast.info('Please purchase a license to access the dashboard', {
                  position: 'top-center',
                  autoClose: 5050,
                  hideProgressBar: false,
                  closeOnClick: true,
                  pauseOnHover: true,
                  draggable: true,
                });
                if (location.pathname !== '/products') {
                  navigate('/products');
                }
              }
            } catch (err) {
              toast.error('Error checking license status');
            }
          }}
        >
          Dashboard
        </Link>
      </nav>

      {/* Wallet Button with dropdown */}
      <div className="header-wallet-container">
        {walletAddress && walletAddress.length > 0 ? (
          <div className="wallet-menu-container">
            <button onClick={toggleDropdown} className="wallet-button wallet-connected">
              <span className="wallet-icon">👻</span> {formatWalletAddress(walletAddress)}
            </button>

            {showDropdown && (
              <div className="dropdown-menu">
                <button onClick={copyAddress} className="dropdown-item">
                  {copied ? "Copied" : "Copy address"}
                </button>
                <button onClick={changeWallet} className="dropdown-item">
                  Change wallet
                </button>
                <button onClick={disconnectWallet} className="dropdown-item">
                  Disconnect
                </button>
              </div>
            )}
          </div>
        ) : (
          <button onClick={handleWalletLogin} className="connect-wallet-btn">
            Connect Wallet
          </button>
        )}
      </div>

    </header>
  );
};

export default Header;

