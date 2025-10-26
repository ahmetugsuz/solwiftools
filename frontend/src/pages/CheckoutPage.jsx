import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { IoArrowBack } from 'react-icons/io5';
import '../styles/CheckoutPage.css';
import CheckoutRadial from '../components/CheckoutRadial';
import TermsModal from '../components/TermsModal';

const CheckoutPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { product } = location.state || {};
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [showError, setShowError] = useState(false);
    const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState('');

    // Redirect if no product is selected
    if (!product) {
        navigate('/products');
        return null;
    }

    const validateEmail = (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    };

    const handleContinue = () => {
        setShowError(false);
        setEmailError('');
        
        let hasError = false;

        if (!email.trim()) {
            setEmailError('Email address is required');
            hasError = true;
        } else if (!validateEmail(email)) {
            setEmailError('Please enter a valid email address');
            hasError = true;
        }

        if (!agreedToTerms) {
            setShowError(true);
            hasError = true;
        }

        if (hasError) return;
        
        navigate('/payment', { state: { product, email } });
    };

    const handleTermsClick = (e) => {
        e.preventDefault();
        setIsTermsModalOpen(true);
    };

    const handleAcceptTerms = () => {
        setAgreedToTerms(true);
        setIsTermsModalOpen(false);
    };

    const handleExitBtn = () => {
        navigate('/Products')
    }

    return (
        <div className="checkout-page">
            <CheckoutRadial />
            <div className="container">
                <button onClick={() => navigate(-1)} className="back-button">
                    <IoArrowBack /> 
                </button>
                
                <h1 className="checkout-title">Checkout</h1>
                <p className="checkout-subtitle">One license added to your cart</p>

                <div className="checkout-content">
                    <div className="product-details-card">
                        <div className="product-info">
                            <h2>{product.name}</h2>
                            <p>{product.description}</p>
                            
                            <div className="product-quantity">
                                <span>Quantity</span>
                                <span>1</span>
                            </div>

                            <div className="payment-method">
                                <span>Payment Method</span>
                                <select>
                                    <option value="solana">Solana</option>
                                </select>
                            </div>

                            <div className="price-info">
                                <span>Price</span>
                                <span>{product.price}</span>
                            </div>
                        </div>
                    </div>

                    <div className="order-summary-card">
                        <div className="summary-header">
                            <h2>Order Summary</h2>
                            <button onClick={ () => handleExitBtn()} className="close-button">×</button>
                        </div>

                        <div className="email-input">
                            <label>Email address</label>
                            <input 
                                type="email" 
                                placeholder="Enter your email" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className={emailError ? 'error' : ''}
                            />
                            {emailError && <p className="error-message">{emailError}</p>}
                        </div>

                        <div className="summary-details">
                            <div className="summary-row">
                                <span>Subtotal</span>
                                <span>{product.price}</span>
                            </div>
                            <div className="summary-row">
                                <span>Network Fee</span>
                                <span>0.00003 SOL</span>
                            </div>
                            <div className="summary-row total">
                                <span>Total</span>
                                <span>{product.price}</span>
                            </div>
                        </div>

                        <div className="terms-section">
                            <label className="terms-checkbox">
                                <input
                                    type="checkbox"
                                    checked={agreedToTerms}
                                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                                />
                                <span>I agree to the <a href="#" onClick={handleTermsClick}>Terms of Service</a></span>
                            </label>
                            {showError && !agreedToTerms && (
                                <p className="error-message">Please agree to the Terms of Service to continue</p>
                            )}
                        </div>

                        <div className="checkout-buttons">
                            <button className="back-btn" onClick={() => navigate(-1)}>Back</button>
                            <button 
                                className={`continue-btn ${!agreedToTerms ? 'disabled' : ''}`}
                                onClick={handleContinue}
                            >
                                Continue
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <TermsModal 
                isOpen={isTermsModalOpen}
                onClose={() => setIsTermsModalOpen(false)}
                onAccept={handleAcceptTerms}
            />
        </div>
    );
};

export default CheckoutPage; 