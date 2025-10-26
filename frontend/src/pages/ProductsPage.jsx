import React from 'react';
import { useNavigate } from 'react-router-dom';
import ReviewsCarousel from '../components/ReviewsCarousel';
import ContactSection from '../components/ContactSection';
import { FaCheck, FaArrowRight } from 'react-icons/fa';
import '../styles/ProductsPage.css'; // You'll need to create this CSS file

const ProductsPage = () => {
    const navigate = useNavigate();

    const products = [
        {
            id: 1,
            name: 'Rental License',
            duration: '72 Hours',
            price: '0.0001 SOL',
            features: [
                'Bundler',
                'Bump It',
                'Volume Tools',
                '72 Hours Duration',
                'Perfect for Testing'
            ]
        },
        {
            id: 2,
            name: 'Lifetime License',
            duration: 'Lifetime Access',
            price: '0.001 SOL',
            features: [
                'Bundler',
                'Bump It',
                'Volume Tools',
                'Lifetime Updates',
                'No Time Restrictions'
            ]
        }
    ];

    const handlePurchase = (product) => {
        navigate('/checkout', { 
            state: { 
                product: {
                    name: product.name,
                    description: product.duration,
                    price: product.price
                }
            } 
        });
    };

    return (
        <div className="products-container">
            <div className="products-radial-right"></div>
            <div className="products-radial-bottom"></div>
            <div className="products-section">
                <h1 className="products-title">Choose Your License</h1>
                <div className="products-grid">
                    {products.map((product) => (
                        <div key={product.id} className="product-card">
                            <h2 className="product-name">{product.name}</h2>
                            <h2 className="product-price">{product.price}</h2>
                            <div className="product-duration">{product.duration}</div>
                            <ul className="product-features">
                                {product.features.map((feature, index) => (
                                    <li key={index}>
                                        <span className="feature-check"><FaCheck /></span>
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                            <div className="purchase-button-container">
                                <button 
                                    className="purchase-button" 
                                    onClick={() => handlePurchase(product)}
                                    style={{
                                        background: 'transparent',
                                        backdropFilter: 'blur(5px)',
                                        border: '1px solid rgba(255, 255, 255, 0.3)',
                                        padding: '14px 24px',
                                        borderRadius: '12px',
                                        fontSize: '16px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                        width: 'fit-content',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '10px',
                                        margin: '20px auto',
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}
                                    onMouseEnter={(e) => {
                                        const button = e.currentTarget;
                                        const text = button.querySelector('span');
                                        const arrow = button.querySelector('svg');
                                        
                                        text.style.transform = 'translateX(-5px)';
                                        text.style.transition = 'transform 0.3s ease';
                                        
                                        arrow.style.transform = 'translateX(5px)';
                                        arrow.style.transition = 'transform 0.3s ease';
                                    }}
                                    onMouseLeave={(e) => {
                                        const button = e.currentTarget;
                                        const text = button.querySelector('span');
                                        const arrow = button.querySelector('svg');
                                        
                                        text.style.transform = 'translateX(0)';
                                        arrow.style.transform = 'translateX(0)';
                                    }}
                                >
                                    <span style={{ 
                                        transition: 'transform 0.3s ease',
                                        color: 'rgba(255, 255, 255, 0.9)',
                                        textShadow: '0 0 2px rgba(255, 255, 255, 0.5)',
                                        fontWeight: '700'
                                    }}>
                                        Purchase Now
                                    </span>
                                    <svg 
                                        width="24" 
                                        height="24" 
                                        viewBox="0 0 24 24" 
                                        fill="none" 
                                        xmlns="http://www.w3.org/2000/svg"
                                        style={{ 
                                            transition: 'transform 0.3s ease',
                                            color: 'rgba(255, 255, 255, 0.9)'
                                        }}
                                    >
                                        <path 
                                            d="M13.5 4.5L21 12M21 12L13.5 19.5M21 12H3" 
                                            stroke="currentColor" 
                                            strokeWidth="2" 
                                            strokeLinecap="round" 
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <ReviewsCarousel />
            <ContactSection />
        </div>
    );
};

export default ProductsPage;
