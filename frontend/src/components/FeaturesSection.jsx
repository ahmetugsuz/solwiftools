import React, { useEffect, useRef } from 'react';
import '../styles/FeaturesSection.css';
import volumeIcon from '../assets/icons/volume.svg';
import bundlerIcon from '../assets/icons/bundler.svg';
import commentIcon from '../assets/icons/comment.svg';
import bumpIcon from '../assets/icons/bump.svg';
import launchImage from '../images/launch-interface.png';
import volumeImage from '../images/volume-interface.png';
import guiImage from '../images/gui-interface.png';
import bubbleImage from '../images/bubble-interface.png';
import raydiumImage from '../images/raydium-interface.png';

import launchImg from '../images/tmp/launch-coin.png'
import GUIFocusedImg from '../images/tmp/GUIFocused.png'
import CryptoMainstreamImg from '../images/tmp/CryptoMainstream.jpeg'
import launchSolanaImg from '../images/tmp/solana-launch.jpeg'
import UnderstandingCryptoImg from '../images/tmp/UnderstandingTokens.jpeg'

const FeaturesSection = () => {
    const titleRef = useRef(null);
    const animationTriggered = useRef(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    console.log('Intersection detected:', entry.isIntersecting); // Debug log
                    if (entry.isIntersecting && !animationTriggered.current) {
                        console.log('Adding reveal class'); // Debug log
                        entry.target.classList.add('reveal');
                        animationTriggered.current = true;
                    }
                });
            },
            {
                threshold: 0.1,
                rootMargin: '0px' // Adjust this if needed
            }
        );

        console.log('Title ref:', titleRef.current); // Debug log

        if (titleRef.current) {
            observer.observe(titleRef.current);
        }

        return () => {
            if (titleRef.current) {
                observer.unobserve(titleRef.current);
            }
        };
    }, []);

    return (
        <div className="features-container">
            <div className="features-radial-left"></div>
            <div className="features-radial-right"></div>
            <section className="title-section">
                <h2 className="features-title" ref={titleRef}>
                    <span className="highlight">Key Features </span>
                    <span className="secondary">That<br />Will Elevate Your<br />Launches</span>
                </h2>
            </section>

            {/* Icon Cards Section */}
            <section className="icon-section">
                <div className="icon-grid">
                    <div className="icon-card">
                        <img src={volumeIcon} alt="Volume" />
                        <h3>Volume</h3>
                        <p>Ensure consistent volume and maximize your token's potential with advanced automated processes.</p>
                    </div>
                    <div className="icon-card">
                        <img src={bundlerIcon} alt="Bundler" />
                        <h3>Bundler</h3>
                        <p>Securely purchase token supply across multiple sub-wallets at launch without triggering flags on trading platforms.</p>
                    </div>
                    <div className="icon-card">
                        <img src={commentIcon} alt="Comment" />
                        <h3>Comment</h3>
                        <p>Post custom comments on any pump.fun token's page to boost visibility and engagement.</p>
                    </div>
                    <div className="icon-card">
                        <img src={bumpIcon} alt="Bump It" />
                        <h3>Bump It</h3>
                        <p>Boost your token to the top, simulating high activity to keep it trending on Pump.fun with minimal cost.</p>
                    </div>
                </div>
            </section>

            {/* Three Feature Cards Section */}
            <section className="features-section-three">
                <div className="feature-grid-three">
                    <div className="feature-card">
                        <h3>Launch Your Token with Ease</h3>
                        <p>Ensure multiple wallet buys. Prevent snipers from buying before you.</p>
                        <img src={launchImg} alt="Launch Interface" />
                    </div>
                    <div className="feature-card">
                        <h3>Boost Your Token's Volume in Multiple Ways</h3>
                        <p>Automate volume, micro-buys, bumps, and more—everything to keep your token active.</p>
                        <img src={launchSolanaImg} alt="Volume Interface" />
                    </div>
                    <div className="feature-card">
                        <h3>GUI Focused on User Experience</h3>
                        <p>Our intuitive layout make it incredibly easy to use.</p>
                        <img src={GUIFocusedImg} alt="GUI Interface" />
                    </div>
                </div>
            </section>

            {/* Two Feature Cards Section */}
            <section className="features-section-two">
                <div className="feature-grid-two">
                    <div className="feature-card">
                        <h3>Bypass Bubble Map Detection Seamlessly</h3>
                        <p>Prevent wallets from being detected on bubble maps.</p>
                        <img src={CryptoMainstreamImg} alt="Bubble Map Interface" />
                    </div>
                    <div className="feature-card">
                        <h3>Pump.Fun to Raydium</h3>
                        <p>Easily manage your token's transition to Raydium</p>
                        <img src={UnderstandingCryptoImg} alt="Raydium Interface" />
                    </div>
                </div>
            </section>
        </div>
    );
};

export default FeaturesSection; 