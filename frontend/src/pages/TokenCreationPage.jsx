import React, { useState, useEffect } from 'react';
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js'; // Import necessary modules
import { Buffer } from 'buffer';
import Footer from '../components/Footer';
import '../styles/TokenCreationPage.css';
import uploadImageIcon from '../images/uploadimage.svg'; // Adjust the path as necessary
import axios from 'axios';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { Transaction, Keypair } from '@solana/web3.js';
import TokenSuccessModal from '../components/TokenSuccessModal';
import TokenList from '../components/TokenList';
import toast from 'react-hot-toast';
import ImageUpload from '../components/ImageUpload';
import { FiUpload } from 'react-icons/fi';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

// Add this back at the top of your component
axios.defaults.baseURL = 'http://localhost:5050';

const TokenCreationPage = () => {
  const { connection } = useConnection();
  const { publicKey, connect } = useWallet(); // Use wallet adapter's connect method
  const [image, setImage] = useState(null);
  const [showSocialLinks, setShowSocialLinks] = useState(false);
  const [socialLinks, setSocialLinks] = useState({
    website: '',
    twitter: '',
    telegram: '',
    discord: ''
  });
  const [tokenInfo, setTokenInfo] = useState({
    name: '',
    symbol: '',
    decimals: 9,
    supply: 1,
    description: ''
  });
  const [advancedOptions, setAdvancedOptions] = useState({
    revokeFreeze: false,
    revokeMint: false,
    revokeUpdate: false
  });
  const [totalCost, setTotalCost] = useState(0.2);
  const [showCreatorInfo, setShowCreatorInfo] = useState(false);
  const [isChecked, setIsChecked] = useState(false); // State for toggle animation
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdToken, setCreatedToken] = useState(null);
  const [tokenImage, setTokenImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const advancedOptionCost = 0.1;

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type and size
      const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        toast.error('Please upload a valid image file (JPG, PNG, or GIF)');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Image size should be less than 5MB');
        return;
      }
      
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setTokenImage(file);
      console.log('Image file set:', file.name); // Debug log
    }
  };

  useEffect(() => {
    const fetchCost = async () => {
      try {
        const addOns = [];
        if (advancedOptions.revokeFreeze) addOns.push('revokeFreeze');
        if (advancedOptions.revokeMint) addOns.push('revokeMint');
        if (advancedOptions.revokeUpdate) addOns.push('revokeUpdate');
        if (showCreatorInfo) addOns.push('creatorInfo');

        const response = await axios.post('/api/tokens/pricing/calculate', { addOns });

        if (response.data && response.data.success) {
          setTotalCost(response.data.costSOL);
        }
      } catch (err) {
        console.error('Failed to calculate cost:', err);
      }
    };

    fetchCost();
  }, [advancedOptions, showCreatorInfo]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTokenInfo({ ...tokenInfo, [name]: value });
  };

  const handleSocialLinkChange = (e) => {
    const { name, value } = e.target;
    setSocialLinks({ ...socialLinks, [name]: value });
  };

  const handleToggleCreatorInfo = () => {
    setShowCreatorInfo(!showCreatorInfo);
    setTotalCost(prevCost => prevCost + (showCreatorInfo ? -advancedOptionCost : advancedOptionCost));
  };

  const handleAdvancedOptionsChange = (e) => {
    const { name, checked } = e.target;
    setAdvancedOptions((prev) => ({ ...prev, [name]: checked }));
    setTotalCost(prevCost => prevCost + (checked ? advancedOptionCost : -advancedOptionCost));
  };

  const handleToggleSocialLinks = () => {
    setShowSocialLinks(!showSocialLinks);
  };

  const handleToggleAnimation = () => {
    setIsChecked(!isChecked);
  };

  const handleImageUpload = (file) => {
    setTokenImage(file);
  };


  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (isLoading) {
        return;
    }

    // ✅ Frontend validation
    if (!tokenInfo.name || !tokenInfo.symbol || tokenInfo.name.trim() === '' || tokenInfo.symbol.trim() === '') {
      toast.error('Please fill out all required fields: Name and Symbol');
      return;
    }
    
    const toastId = toast.loading("Creating token...");
    setIsLoading(true);
    let finalizeResponse;
    try {
        if (!publicKey) {
            console.log('Wallet check failed:', { publicKey });
            toast.error('Please connect your wallet first', { id: toastId });
            setIsLoading(false);
            return;
        }

        // Collect all selected add-ons
        const addOns = [];
        if (advancedOptions.revokeFreeze) addOns.push('revokeFreeze');
        if (advancedOptions.revokeMint) addOns.push('revokeMint');
        if (advancedOptions.revokeUpdate) addOns.push('revokeUpdate');
        if (showCreatorInfo) addOns.push('creatorInfo');

        // Create FormData for token details
        const formData = new FormData();
        formData.append('tokenName', tokenInfo.name);
        formData.append('tokenSymbol', tokenInfo.symbol);
        formData.append('payerPublicKey', publicKey?.toBase58());
        formData.append('addOns', JSON.stringify(addOns));
        
        if (tokenImage) {
            formData.append('tokenImage', tokenImage, tokenImage.name);
        }

        const tokenDetails = {
            decimals: parseInt(tokenInfo.decimals),
            initialSupply: parseInt(tokenInfo.supply),
            fixedSupply: advancedOptions.revokeMint,
            description: tokenInfo.description || '',
            revokeAuthorities: {
                freeze: advancedOptions.revokeFreeze,
                mint: advancedOptions.revokeMint,
                update: advancedOptions.revokeUpdate
            }
        };

        console.log('Token details being sent:', tokenDetails);

        formData.append('tokenDetails', JSON.stringify(tokenDetails));

        if (showCreatorInfo) {
          const creatorNameInput = document.getElementById('creatorname');
          const creatorWebsiteInput = document.getElementById('creatorwebsite');
          if (creatorNameInput && creatorNameInput.value) {
            formData.append('creatorName', creatorNameInput.value);
          }
          if (creatorWebsiteInput && creatorWebsiteInput.value) {
            formData.append('creatorWebsite', creatorWebsiteInput.value);
          }
        }

        formData.append('mode', 'prepare');
        const prepareResponse = await axios.post('/api/tokens/payment', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Accept': 'application/json'
          }
        });
        
        if (!prepareResponse.data.success) {
          throw new Error(prepareResponse.data.error || 'Failed to prepare transaction');
        }

        // Get fresh blockhash for both transactions
        const { blockhash } = await connection.getLatestBlockhash();

        // Handle payment transaction
        const paymentTransaction = Transaction.from(Buffer.from(prepareResponse.data.paymentTransaction, 'base64'));
        paymentTransaction.recentBlockhash = blockhash;
        paymentTransaction.feePayer = publicKey;

        // Debug logs for payment transaction
        console.log('[DEBUG] Payment transaction before signing:', paymentTransaction);
        console.log('[DEBUG] Payment transaction instructions:', paymentTransaction.instructions);
        console.log('[DEBUG] Payment transaction feePayer:', paymentTransaction.feePayer?.toBase58());
        console.log('[DEBUG] Payment transaction recentBlockhash:', paymentTransaction.recentBlockhash);

        let signedPayment;
        try {
            console.log('[DEBUG] Attempting to sign payment transaction...');
            signedPayment = await window.solana.signTransaction(paymentTransaction);
            console.log('[DEBUG] Payment transaction signed:', signedPayment);
        } catch (signError) {
            console.error('[DEBUG] Standard signing failed:', signError);
            throw signError;
        }

        try {
            console.log('[DEBUG] Sending payment transaction...');
            const paymentSignature = await connection.sendRawTransaction(signedPayment.serialize());
            console.log('[DEBUG] Payment transaction sent:', paymentSignature);

            // Wait for payment confirmation
            const paymentConfirmation = await connection.confirmTransaction(paymentSignature);
            if (paymentConfirmation.value.err) {
                throw new Error('Payment transaction failed to confirm');
            }
            
            // ✅ Finalize payment with backend
            if (paymentConfirmation.value && !paymentConfirmation.value.err) {
              formData.set('mode', 'finalize');
              formData.set('paymentSignature', paymentSignature);
              formData.set('mintPublicKey', prepareResponse.data.mintKeypair.publicKey);

              finalizeResponse = await axios.post('/api/tokens/payment', formData, {
                headers: {
                  'Content-Type': 'multipart/form-data',
                  'Accept': 'application/json'
                }
              });
            
              if (!finalizeResponse.data.success) {
                throw new Error(finalizeResponse.data.error || 'Finalization failed');
              }
            } else {
              throw new Error('Payment transaction not confirmed — skipping finalization.');
            }
            

            console.log('[DEBUG] Payment transaction confirmed:', paymentConfirmation);


        } catch (sendError) {
          console.error('[DEBUG] Error sending payment transaction:', sendError);
      
          let message = sendError?.message || 'Transaction failed';
      
          const errString = JSON.stringify(sendError).toLowerCase();
          if (errString.includes('insufficient') || errString.includes('custom program error: 0x1')) {
              message = 'You do not have enough SOL to cover the transaction fees. Please fund your wallet.';
          }
      
          //toast.error(message);
          throw new Error(message); // Also throw for outer catch
      }
      

        // Handle token creation transaction
        const tokenCreationTransaction = Transaction.from(Buffer.from(prepareResponse.data.tokenCreationTransaction, 'base64'));
        tokenCreationTransaction.recentBlockhash = blockhash;
        tokenCreationTransaction.feePayer = publicKey;

        // Remove all signatures
        tokenCreationTransaction.signatures = [];

        // 1. Sign with user's wallet (Phantom) FIRST
        let signedTokenCreation = await window.solana.signTransaction(tokenCreationTransaction);

        // 2. Reconstruct mintKeypair
        const mintKeypair = Keypair.fromSecretKey(
          Uint8Array.from(prepareResponse.data.mintKeypair.secretKey)
        );

        // 3. Partial sign with mintKeypair
        signedTokenCreation.partialSign(mintKeypair);
        console.log('[DEBUG] Signed with user and mintKeypair:', {
          user: publicKey.toBase58(),
          mint: mintKeypair.publicKey.toBase58(),
          signatures: signedTokenCreation.signatures.map(sig => ({
            pubkey: sig.publicKey.toBase58(),
            signature: sig.signature ? Buffer.from(sig.signature).toString('base64') : null
          }))
        });

        // 4. Send the transaction
        try {
            console.log('[DEBUG] Sending token creation transaction...');
            const tokenCreationSignature = await connection.sendRawTransaction(signedTokenCreation.serialize());
            console.log('[DEBUG] Token creation transaction sent:', tokenCreationSignature);

            // Wait for token creation confirmation
            const tokenCreationConfirmation = await connection.confirmTransaction(tokenCreationSignature);
            if (tokenCreationConfirmation.value.err) {
                throw new Error('Token creation transaction failed to confirm');
            }
            console.log('[DEBUG] Token creation transaction confirmed:', tokenCreationConfirmation);
        } catch (sendError) {
            console.error('[DEBUG] Error sending token creation transaction:', sendError);
            throw sendError;
        }

        // Show success message
        toast.dismiss(toastId);
        toast.success("Token created successfully!", { autoClose: 5050 });

        // Update created token state
        setCreatedToken({
          mintAddress: prepareResponse.data.mintKeypair.publicKey,
          name: tokenInfo.name,
          symbol: tokenInfo.symbol,
          decimals: tokenInfo.decimals,
          supply: tokenInfo.supply,
          savedToken: finalizeResponse.data.savedToken || null
        });

        setShowSuccessModal(true);

    } catch (error) {
        toast.dismiss(toastId);
        console.error("Detailed error:", {
            message: error.message,
            stack: error.stack,
            name: error.name,
            error: error
        });
        toast.error(error.message || "Failed to create token", {
            position: "bottom-right",
            autoClose: 5050
        });
    } finally {
        setIsLoading(false);
    }
  };

  const connectPhantom = async () => {
    if (!window.solana || !window.solana.isPhantom) {
      toast.error('Please install Phantom wallet extension.');
      return;
    }
    try {
      await window.solana.connect();
      toast.success('Phantom wallet connected!');
    } catch (err) {
      toast.error('Failed to connect Phantom wallet');
    }
  };

  return (
    <div id="root" className="bg-dark">
      <section className="min-h-screen flex justify-center items-start">
        <div className="w-full mx-4 lg:w-[55%] lg:mx-auto bg-dark rounded-xl p-8 space-y-6">
          {/* Main Card */}
          <div className="main-card p-5 space-y-3">
            <h1 className="text-gradient text-center text-3xl lg:text-4xl">Create Solana Token</h1>
            <p className="text-center mt-2">Easily Create your own Solana SPL Token in just 7+1 steps without Coding.</p>

            {/* Flexbox for Upload Image and Token Information */}
            <div className="main-content">
              {/* Left Column - Smaller Section */}
              <div className="left-section">
                {/* Upload Image Card - Wrapped in a label */}
                <div className="upload-image-card">
                  <label className="relative flex flex-col items-center justify-center w-full h-full cursor-pointer">
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                    
                    {previewUrl ? (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <img 
                          src={previewUrl} 
                          alt="Token preview" 
                          className="w-full h-full object-contain p-2 rounded-lg"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                          <div className="text-white text-center">
                            <FiUpload className="mx-auto text-2xl mb-2" />
                            <p className="text-sm">Click to change image</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full">
                        <FiUpload className="text-gray-300 text-3xl mb-3" />
                        <p className="text-sm text-gray-300">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          PNG, JPG, GIF (MAX. 800x800px)
                        </p>
                      </div>
                    )}
                  </label>
                </div>

                {/* Add Social Links Header and Toggle */}
                <div className="flex items-center justify-between mt-4">
                  <h2 className="text-lg">Add Social Links & Tags (Optional)</h2>
                  <div className="checkbox-wrapper-58">
                    <label className="switch">
                      <input type="checkbox" checked={showSocialLinks} onChange={handleToggleSocialLinks} />
                      <span className="slider"></span>
                    </label>
                  </div>
                </div>

                {/* Social Links Card - Initially hidden */}
                {showSocialLinks && (
                  <div className="social-links-card bg-glass rounded-2xl p-5 space-y-3">
                    <div className="space-y-3">
                      <input type="url" placeholder="Website URL" name="website" value={socialLinks.website} onChange={handleSocialLinkChange} className="w-full bg-transparent border border-gray-400 px-3 rounded-[5px] text-sm h-10" />
                      <input type="url" placeholder="Twitter URL" name="twitter" value={socialLinks.twitter} onChange={handleSocialLinkChange} className="w-full bg-transparent border border-gray-400 px-3 rounded-[5px] text-sm h-10" />
                      <input type="url" placeholder="Telegram URL" name="telegram" value={socialLinks.telegram} onChange={handleSocialLinkChange} className="w-full bg-transparent border border-gray-400 px-3 rounded-[5px] text-sm h-10" />
                      <input type="url" placeholder="Discord URL" name="discord" value={socialLinks.discord} onChange={handleSocialLinkChange} className="w-full bg-transparent border border-gray-400 px-3 rounded-[5px] text-sm h-10" />
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Larger Section */}
              <form action="" className="right-section bg_glass p-5 rounded-2xl space-y-5">
                <div className="space-y-2">
                  <label htmlFor="tokenName" className="text-sm">Name <sup className="text-red-600">*</sup></label>
                  <input type="text" id="tokenName" placeholder="Token Name" className="w-full bg-transparent px-3 border border-gray-400 rounded-[5px] text-sm h-10" value={tokenInfo.name} onChange={handleInputChange} name="name" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="symbol" className="text-sm">Symbol <sup className="text-red-600">*</sup></label>
                  <input type="text" id="symbol" placeholder="Your Token Symbol" className="w-full bg-transparent border border-gray-400 px-3 rounded-[5px] text-sm h-10" value={tokenInfo.symbol} onChange={handleInputChange} name="symbol" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="decimal" className="text-sm">Decimals <sup className="text-red-600">*</sup></label>
                  <input type="number" id="decimal" placeholder="Your Token Decimal" className="w-full bg-transparent border border-gray-400 px-3 rounded-[5px] text-sm h-10" value={tokenInfo.decimals} onChange={handleInputChange} name="decimals" />
                  <p className="text-sm text-gray-400">Most meme coin use 9 decimals</p>
                </div>
                <div className="space-y-2">
                  <label htmlFor="supply" className="text-sm">Supply <sup className="text-red-600">*</sup></label>
                  <input type="number" id="supply" placeholder="Your Token Supply" className="w-full bg-transparent border border-gray-400 px-3 rounded-[5px] text-sm h-10" value={tokenInfo.supply} onChange={handleInputChange} name="supply" />
                  <p className="text-sm text-gray-400">Most meme coin use 10B</p>
                </div>
                <div className="space-y-2">
                  <label htmlFor="desc" className="text-sm">Description <sup className="text-red-600">*</sup></label>
                  <textarea id="desc" placeholder="Description" className="w-full bg-transparent px-3 border border-gray-400 rounded-[5px] text-sm h-20" value={tokenInfo.description} onChange={handleInputChange} name="description"></textarea>
                </div>

                {/* Toggle for Creator Information */}
                <div className="flex items-center justify-between mt-4">
                  <label className="flex items-center gap-x-2">
                    <span className="text-sm text-gray-300">Modify Creator Information<span className="text-gray-400"> (Optional)</span></span>
                    <div className="checkbox-wrapper-58">
                      <label className="switch">
                        <input
                          type="checkbox"
                          checked={showCreatorInfo}
                          onChange={handleToggleCreatorInfo}
                        />
                        <span className="slider"></span>
                      </label>
                    </div>
                  </label>
                  <span className="text-sm text-gray-400">(+0.1 SOL)</span>
                </div>
                <p className="text-sm text-gray-400 mt-2">Change the information of the creator in the metadata. By default, it is SolWifTools.</p>

                {/* Creator Information Fields */}
                {showCreatorInfo && (
                  <div className="space-y-3 transition-all duration-300 max-h-[1000px] opacity-100">
                    <div className="space-y-2">
                      <label htmlFor="creatorname" className="text-sm">Creator Name</label>
                      <input type="text" placeholder="Creator Name" id="creatorname" className="w-full bg-transparent border border-gray-400 px-3 rounded-[5px] text-sm h-10" />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="creatorwebsite" className="text-sm">Creator Website</label>
                      <input type="text" placeholder="Creator Website" id="creatorwebsite" className="w-full bg-transparent border border-gray-400 px-3 rounded-[5px] text-sm h-10" />
                    </div>
                  </div>
                )}
              </form>
            </div>

            {/* Advanced Options Section */}
            <div className="mt-10 relative">
              <div className="radial-background1"></div>
              <div className="radial-background2"></div>
              <h2 className="text-lg font-bold text-white text-left">Advanced Options</h2>
              <h3 className="mt-6 text-white text-left">Revoke Authorities</h3>
              <p className="text-sm text-gray-400 text-left">Solana Token has 3 authorities: Freeze Authority, Mint Authority, and Update Authority. Revoke them to attract more investors.</p>
              <div className="mt-4 flex justify-between advanced-options">
                {/* Revoke Freeze Option */}
                <div className={`bg_glass border border-gray-700 rounded-xl p-4 flex-1 mx-2 checkbox-wrapper-30`}>
                  <div className={`glow-effect ${advancedOptions.revokeFreeze ? 'active' : ''}`}></div>
                  <h4 className="text-sm text-white text-left">Revoke Freeze</h4>
                  <p className="text-xs text-gray-400 mt-2 text-left">Freeze Authority allows you to freeze token accounts of holders.</p>
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-sm text-gray-300">+0.1 SOL</span>
                    <div className="checkbox-wrapper-30">
                      <span className="checkbox">
                        <input
                          type="checkbox"
                          id="revokeFreeze"
                          name="revokeFreeze"
                          checked={advancedOptions.revokeFreeze}
                          onChange={handleAdvancedOptionsChange}
                        />
                        <svg><use href="#checkbox-30" className="checkbox"></use></svg>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Revoke Mint Option */}
                <div className={`bg_glass border border-gray-700 rounded-xl p-4 flex-1 mx-2 checkbox-wrapper-30`}>
                  <div className={`glow-effect ${advancedOptions.revokeMint ? 'active' : ''}`}></div>
                  <h4 className="text-sm text-white text-left">Revoke Mint</h4>
                  <p className="text-xs text-gray-400 mt-2 text-left">Mint Authority allows you to mint more supply of your token.</p>
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-sm text-gray-300">+0.1 SOL</span>
                    <div className="checkbox-wrapper-30">
                      <span className="checkbox">
                        <input
                          type="checkbox"
                          id="revokeMint"
                          name="revokeMint"
                          checked={advancedOptions.revokeMint}
                          onChange={handleAdvancedOptionsChange}
                        />
                        <svg><use href="#checkbox-30" className="checkbox"></use></svg>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Revoke Update Option */}
                <div className={`bg_glass border border-gray-700 rounded-xl p-4 flex-1 mx-2 checkbox-wrapper-30`}>
                  <div className={`glow-effect ${advancedOptions.revokeUpdate ? 'active' : ''}`}></div>
                  <h4 className="text-sm text-white text-left">Revoke Update</h4>
                  <p className="text-xs text-gray-400 mt-2 text-left">Update Authority allows you to update the token metadata.</p>
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-sm text-gray-300">+0.1 SOL</span>
                    <div className="checkbox-wrapper-30">
                      <span className="checkbox">
                        <input
                          type="checkbox"
                          id="revokeUpdate"
                          name="revokeUpdate"
                          checked={advancedOptions.revokeUpdate}
                          onChange={handleAdvancedOptionsChange}
                        />
                        <svg><use href="#checkbox-30" className="checkbox"></use></svg>
                      </span>
                    </div>
                  </div>
                </div>
              </div> {/* End advanced-options flex */}
            </div> {/* End mt-10 relative */}

            {/* Connect Wallet / Create Token Button */}
            <div className="flex flex-col items-center justify-center mt-5">
              {!publicKey ? (
                <>
                  <WalletMultiButton className="border-animation-button bg-glass text-primary rounded-full px-8 py-3 relative group" />
                  <span style={{ color: '#aaa', fontSize: '0.95rem', marginTop: 8, textAlign: 'center' }}>
                    Only <b>Phantom</b> is available at the moment. Please use Phantom to connect.
                  </span>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="border-animation-button bg-glass text-primary rounded-full px-8 py-3 relative group"
                >
                  <span className="relative z-10 group-hover:text-green-400 transition-colors duration-300 delay-1000">
                    {isLoading ? 'Creating Token...' : 'Create Token'}
                  </span>
                  <span className="border-animation"></span>
                </button>
              )}
            </div>
            <p className="text-center text-sm mt-3">Total Fees: <span className="text-gradient">{totalCost.toFixed(2)}</span> SOL only today</p>

            {/* Instructions Section - Moved to the bottom */}
            <div className="w-full mt-10 rounded-xl space-y-8 instructions-container">
              <h1 className="text-gradient text-3xl lg:text-4xl font-bold text-center">How to use Solana Token Creator</h1>
              <div className="flex flex-col lg:flex-row items-stretch gap-8">
                <div className="w-full bg_glass rounded-xl p-6 space-y-4">
                  <h2 className="text-xl font-bold text-white text-left">Follow these simple steps:</h2>
                  <ol className="list-decimal space-y-3 text-gray-300 pl-5 text-left">
                    <li>Connect your Solana wallet.</li>
                    <li>Write the name you want for your Token.</li>
                    <li>Indicate the symbol (max 8 characters).</li>
                    <li>Select the decimals quantity (0 for Whitelist Token, 6 for utility token).</li>
                    <li>Write the description you want for your SPL Token.</li>
                    <li>Upload the image for your token (PNG).</li>
                    <li>Put the supply of your Token.</li>
                    <li>Click on "Create," accept the transaction, and wait until your token is ready.</li>
                  </ol>
                </div>
              </div>
              <div className="bg_glass rounded-xl p-6 lg:p-8 text-gray-300 text-sm space-y-4">
                <p className="text-left">The cost of creating the Token is <span className="text-gradient font-bold">0.2 SOL</span>, which includes all fees needed for the SPL Token creation.</p>
                <p className="text-left">The creation process will start and will take some seconds. After that, you will receive the total supply of the token in the wallet you chose.</p>
                <p className="text-left">Check here a whole blog post about <a href="#" className="text-gradient underline">how to create a Solana Token</a></p>
              </div>
            </div>
          </div> {/* End main-card */}
        </div> {/* End w-full mx-4 ... */}
      </section>
      <div className="radial-background"></div>

      {/* Success Modal */}
      <TokenSuccessModal 
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        tokenDetails={createdToken}
      />

      {/* Add the token list */}
      {/**
      <div className="mt-12">
        <TokenList walletAddress={publicKey?.toBase58()} />
      </div>
      **/}
    </div> // End #root
  );
};

export default TokenCreationPage;