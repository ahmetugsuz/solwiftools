import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/HomePage.css';
import Header from '../components/Header';
import ContactSection from '../components/ContactSection';
import FeaturesSection from '../components/FeaturesSection';
import CryptoChart from '../components/CryptoChart';
import GridBackground from '../components/GridBackground';


const HomePage = () => {
    const navigate = useNavigate();

    return (
        <div className="home-page" style={{ position: 'relative' }}>
            <GridBackground />
            <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', top: 0, width: '100%', height: '100%', zIndex: 0 }}>
                </div>

                <div className="home-container" style={{ position: 'relative', zIndex: 1 }}>
                    <Header />
                    <div style={{ position: 'relative', height: '-100vh', marginBottom: '2rem' }}>
                    </div>

                    <div className="hero-section"style={{ background: 'transparent' }}> 

                        <h1 className="hero-title">
                            All-In-One Memecoin
                            <br />
                            Launchpad
                        </h1>
                        <p className="hero-subtitle">
                            Dominate on the blockchain with our AI-powered 
                            <br />
                            solutions and tools for token developers.
                        </p>
                        <div className="cta-buttons">
                            <button 
                                className="purchase-button" 
                                onClick={() => navigate('/products')}
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
                                    Purchase Today
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

                    <FeaturesSection />
                    <ContactSection />
                </div>
            </div>
            <div className="home-radial-middle"></div>
        </div>
    );
};

export default HomePage;