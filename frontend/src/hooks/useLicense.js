import { useState } from 'react';
import axios from 'axios';

export const useLicense = (connectWallet, setWalletAddress) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const ensureValidToken = async () => {
        let token = localStorage.getItem('jwt');
        if (!token) {
          try {
            const walletAddress = await connectWallet();
            if (!walletAddress) {
                throw new Error('Wallet connection failed');
            }
            const challengeRes = await fetch(`/api/users/auth/challenge?wallet=${walletAddress}`);
            const { challenge } = await challengeRes.json();
      
            const encodedMessage = new TextEncoder().encode(challenge);
            const signed = await window.solana.signMessage(encodedMessage, 'utf8');
            const signature = bs58.encode(signed.signature);
      
            const verifyRes = await fetch('/api/users/auth/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ walletAddress, signature })
            });
      
            const verifyData = await verifyRes.json();
            if (verifyData.token) {
              localStorage.setItem('jwt', verifyData.token);
              setWalletAddress(walletAddress);
              token = verifyData.token;
            } else {
              throw new Error('Re-authentication failed');
            }
          } catch (err) {
            console.error('Token recovery failed:', err);
            throw err;
          }
        }
        return token;
      };      

      const createLicense = async (licenseData) => {
        setLoading(true);
        setError(null);
        try {
          const token = await ensureValidToken();
          const response = await axios.post('/api/license/purchase', licenseData, {
            headers: { Authorization: `Bearer ${token}` }
          });
          return response.data.license;
        } catch (err) {
          setError(err.message);
          throw err;
        } finally {
          setLoading(false);
        }
      };
      
      const checkLicenseValidity = async () => {
        try {
          const token = await ensureValidToken();
          const response = await axios.get('/api/license/dashboard/access', {
            headers: { Authorization: `Bearer ${token}` }
          });
          return response.data.hasAccess;
        } catch (err) {
          setError(err.message);
          return false;
        }
      };
      
      const validateLicenseById = async (licenseId) => {
        try {
          const token = await ensureValidToken();
          const response = await axios.get(`/api/license/validate/${licenseId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          return response.data;
        } catch (err) {
          setError(err.message);
          return { isValid: false, message: err.message };
        }
      };
      

    return {
        createLicense,
        checkLicenseValidity,
        validateLicenseById,
        loading,
        error
    };
}; 