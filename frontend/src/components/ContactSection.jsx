import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/ContactSection.css';
import { FaTwitter, FaDiscord } from 'react-icons/fa'; // Make sure to install react-icons

const ContactSection = () => {
    return (
        <div className="contact-section">
            <h2>DON'T KNOW WHERE TO START?</h2>
            <p className="contact-text">
                Got a question or need some help? Get in touch. We'd love to hear from you. 
                <Link to="/contact" className="contact-link">Contact Us</Link>
            </p>
            <div className="social-links">
                <a href="https://twitter.com/solwiftools" 
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="social-link twitter">
                    <FaTwitter size={24} />
                </a>
                <a href="https://discord.gg/yourinvite" 
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="social-link discord">
                    <FaDiscord size={24} />
                </a>
            </div>
        </div>
    );
};

export default ContactSection; 