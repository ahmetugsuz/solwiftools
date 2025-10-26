// this file is prob. not in use
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { IoArrowBack } from 'react-icons/io5';
import CheckoutRadial from '../components/CheckoutRadial';
import '../styles/LoginPage.css';
import bs58 from 'bs58';
import { toast } from 'react-toastify';

const LoginPage = ({ connectWallet, setWalletAddress, walletAddress, handleWalletLogin }) => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);

    // This ensures that the `walletAddress` is updated properly
    useEffect(() => {
        if (walletAddress) {
            console.log("Wallet Address updated:", walletAddress);
        }
    }, [walletAddress]);

    const handlePhantomLogin = async () => {
        setIsLoading(true);
        try {
          await handleWalletLogin(); // ✅ Use unified login
          navigate('/dashboard');
        } catch (err) {
          toast.error('Login failed');
        } finally {
          setIsLoading(false);
        }
      };
      
      

    return (
        <div className="login-container">
            <div className="login-card">
                <button onClick={() => navigate(-1)} className="wallet-close-button">×</button>
                <h1 className="login-wallet-h1">Login with Phantom Wallet</h1>
                <button
                    onClick={handlePhantomLogin}
                    className="login-purple-btn"
                    disabled={isLoading || walletAddress}
                >
                    {isLoading ? 'Connecting...' : 'Login with Phantom'}
                </button>
                {walletAddress && (
                    <div className="wallet-connected-info">
                        <p>Connected Wallet Address:</p>
                        <p>{walletAddress}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LoginPage;
