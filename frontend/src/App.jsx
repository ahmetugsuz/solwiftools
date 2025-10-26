import React, { useState, useEffect } from 'react';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import TokenCreationPage from './pages/TokenCreationPage';
import Header from './components/Header';
import Footer from './components/Footer';
import SpecialPrivilegesModal from './components/SpecialPrivilegesModal';
import ProductsPage from './pages/ProductsPage';
import ContactPage from './pages/ContactPage';
import CheckoutPage from './pages/CheckoutPage';
import PaymentPage from './pages/PaymentPage';
import '@solana/wallet-adapter-react-ui/styles.css';
import './styles/main.css';
import './styles/TokenCreationPage.css';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import { useMemo } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import LiquidityPage from './pages/LiquidityPage';
import YourTokensPage from './pages/YourTokensPage';
import LoginModal from './components/LoginModal';

// Create a wrapper component for the router-dependent code
const AppContent = () => {
    const [walletAddress, setWalletAddress] = useState(() => localStorage.getItem('walletAddress') || '');
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem('jwt'));
    const navigate = useNavigate();
    const location = useLocation();

    const myWalletAddress = "2vd5ru6SiwSzixfEfgyZ6HJ2HMCw9EoaJGDXWqMYQhGX";

    const network = WalletAdapterNetwork.MainnetBeta;
    const endpoint = useMemo(() => 'https://maximum-falling-leaf.solana-mainnet.quiknode.pro/f8542a105543937e8a2a44ae2cd850a1cd2ee6cc/', []);
    const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

    // Function to connect the wallet using Phantom
    const connectWallet = async () => {
        if (window.solana && window.solana.isPhantom) {
            try {
                const response = await window.solana.connect();
                const connectedAddress = response.publicKey.toString();
                setWalletAddress(connectedAddress); // Set the wallet address
                console.log("Connected Wallet Address:", connectedAddress);
            } catch (error) {
                console.error("Error connecting to Phantom wallet:", error);
            }
        } else {
            alert("Please install Phantom wallet extension.");
        }
    };

    // Check if the connected wallet is yours (or a bundler purchaser)
    const isBundlerPurchaser = (address) => {
        return address === myWalletAddress; // If the address matches your wallet, give access
    };

    // GSAP animation for page load
    useEffect(() => {
        gsap.fromTo("body", {
            opacity: 0,
        }, {
            opacity: 1,
            duration: 1,
            ease: "power2.out",
        });
    }, []);

    // Debugging: Log the current path
    useEffect(() => {
        console.log("Current Path:", location.pathname);
    }, [location]);

    // Add class when on dashboard route for styling
    useEffect(() => {
        if (location.pathname === '/dashboard') {
            document.body.classList.add('dashboard-page');
        } else {
            document.body.classList.remove('dashboard-page');
        }
    }, [location]);

    const isLoggedIn = () => {
        const wallet = localStorage.getItem('walletAddress');
        const token = localStorage.getItem('jwt');
        return !!wallet && !!token;
    };
      
    const handleWalletLogin = async () => {
        try {
          const address = await connectWallet();
          if (!address) return;
      
          const challengeRes = await fetch(`/api/users/auth/challenge?wallet=${address}`);
          const { challenge } = await challengeRes.json();
      
          const encodedMessage = new TextEncoder().encode(challenge);
          const signed = await window.solana.signMessage(encodedMessage, "utf8");
          const signature = bs58.encode(signed.signature);
      
          const verifyRes = await fetch('/api/users/auth/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ walletAddress: address, signature })
          });
          const verifyData = await verifyRes.json();
      
          if (verifyData.token) {
            localStorage.setItem('jwt', verifyData.token);
            localStorage.setItem('walletAddress', address);
            setWalletAddress(address);
            toast.success('Wallet connected and logged in');
          } else {
            toast.error(verifyData.error || 'Login failed');
          }
        } catch (err) {
          toast.error('Wallet connection failed');
          console.error(err);
        }
      };
      

    return (
        <div className="relative">
            {/* Always render header */}
            <Header connectWallet={connectWallet} walletAddress={walletAddress} setShowLoginModal={setShowLoginModal} handleWalletLogin={handleWalletLogin}/>

            {/* Show special privileges modal if wallet is connected and logged in as bundler purchaser */}
            {isModalVisible && <SpecialPrivilegesModal />}

            <LoginModal
                open={showLoginModal}
                onClose={() => setShowLoginModal(false)}
                connectWallet={connectWallet}
                setWalletAddress={setWalletAddress}
                walletAddress={walletAddress}
                handleWalletLogin={handleWalletLogin}
            />

            {/* Main content area */}
            <main className="app-content min-h-screen overflow-y-auto">
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    {/* Conditional rendering of DashboardPage */}
                    <Route path="/dashboard" element={
                        walletAddress && localStorage.getItem('jwt') ? (
                            <div className="dashboard-container"> 
                            <DashboardPage 
                                connectWallet={connectWallet} 
                                walletAddress={walletAddress}
                            />
                            </div>
                        ) : (
                            <LoginModal
                            open={true}
                            onClose={() => navigate('/')}
                            connectWallet={connectWallet}
                            setWalletAddress={setWalletAddress}
                            walletAddress={walletAddress}
                            />
                        )
                    } />

                    <Route path="/Create-Token" element={<TokenCreationPage />} />
                    <Route path="/Your-Tokens" element={<YourTokensPage />} />
                    <Route path="/liquidity" element={<LiquidityPage />} />
                    <Route path="/products" element={<ProductsPage />} />
                    <Route path="/contact" element={<ContactPage />} />
                    <Route path="/checkout" element={<CheckoutPage />} />
                    <Route path="/payment" element={<PaymentPage 
                    connectWallet={connectWallet} 
                    setWalletAddress={setWalletAddress}
                    />} />
                </Routes>
            </main>
        </div>
    );
};

const App = () => {
    const network = WalletAdapterNetwork.MainnetBeta;
    const endpoint = useMemo(() => 'https://maximum-falling-leaf.solana-mainnet.quiknode.pro/f8542a105543937e8a2a44ae2cd850a1cd2ee6cc/', []);
    const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>
                    <ToastContainer
                        position="top-right"
                        autoClose={3000}
                        hideProgressBar={false}
                        newestOnTop
                        closeOnClick
                        rtl={false}
                        pauseOnFocusLoss
                        draggable
                        pauseOnHover
                        theme="dark"
                        style={{ position: 'fixed', zIndex: 9999 }}
                    />
                    <AppContent />
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
};

export default App;
