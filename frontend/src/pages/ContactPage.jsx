import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoArrowBack } from 'react-icons/io5'; // Make sure react-icons is installed
import '../styles/ContactPage.css';

const ContactPage = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        message: ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        // Add your email submission logic here
        console.log('Form submitted:', formData);
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleBack = () => {
        navigate(-1); // This will go back to the previous page
    };

    return (
        <div className="contact-page">
            <button onClick={handleBack} className="back-button">
                <IoArrowBack size={24} />
            </button>
            <div className="contact-form-container">
                <h1>Contact Us</h1>
                <p>We'd love to hear from you. Send us a message and we'll respond as soon as possible.</p>
                
                <form onSubmit={handleSubmit} className="contact-form">
                    <div className="form-group">
                        <label htmlFor="name">Name</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="message">Message</label>
                        <textarea
                            id="message"
                            name="message"
                            value={formData.message}
                            onChange={handleChange}
                            required
                            rows="6"
                        />
                    </div>
                    
                    <button type="submit" className="submit-button">Send Message</button>
                </form>
            </div>
        </div>
    );
};

export default ContactPage; 