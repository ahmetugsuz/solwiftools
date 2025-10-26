import React from 'react';
import { Link } from 'react-router-dom';
import '..styles/HeroSection'; // Import the custom CSS file

const HeroSection = () => {
  return (
    <div className="hero-section">
      <h1>Welcome to CoinCraft</h1>
      <p className="text-gray-300 mb-8 max-w-2xl">
        The ultimate platform for launching and managing your own Solana-based tokens.
      </p>
      <div className="button-container">
        <Link
          to="/create-token"
          className="button"
        >
          Get Started
        </Link>
        <Link
          to="/products"
          className="button"
        >
          Learn More
        </Link>
      </div>
    </div>
  );
};

export default HeroSection;
