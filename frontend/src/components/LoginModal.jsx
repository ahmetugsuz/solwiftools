import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import bs58 from 'bs58';
import { toast } from 'react-toastify';
import '../styles/LoginModal.css';

export default function LoginModal({ open, onClose, connectWallet, setWalletAddress, walletAddress, handleWalletLogin}) {
  const modalRef = useRef(null);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  // Trap focus inside modal
  useEffect(() => {
    if (open && modalRef.current) {
      modalRef.current.focus();
    }
  }, [open]);

  const handlePhantomLogin = async () => {
    setIsLoading(true);
    try {
      await handleWalletLogin(); // ✅ Use unified login
      onClose();
      navigate('/dashboard');
    } catch (err) {
      toast.error('Login failed');
    } finally {
      setIsLoading(false);
    }
  };
  

  if (!open) return null;
  return (
    <div className="login-modal-overlay" onClick={onClose}>
      <div
        className="login-modal-card animate-in"
        tabIndex={-1}
        ref={modalRef}
        onClick={e => e.stopPropagation()}
      >
        <button className="login-modal-close" onClick={onClose} aria-label="Close">×</button>
        <h1 className="login-wallet-h1">Login With Phantom Wallet</h1>
        <button
          onClick={handlePhantomLogin}
          className="login-purple-btn"
          disabled={isLoading}
        >
          {isLoading ? 'Connecting...' : 'Connect Wallet'}
        </button>
      </div>
    </div>
  );
} 