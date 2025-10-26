import React from 'react';
import '../styles/TermsModal.css';
import { IoClose } from 'react-icons/io5';

const TermsModal = ({ isOpen, onClose, onAccept }) => {
    if (!isOpen) return null;

    return (
        <div className="terms-modal-overlay">
            <div className="terms-modal">
                <div className="terms-modal-header">
                    <h2>Terms of Service</h2>
                    <button className="close-button" onClick={onClose}>
                        <IoClose />
                    </button>
                </div>
                
                <div className="terms-modal-content">
                    <p className="terms-subtitle">Please read these terms carefully before proceeding.</p>
                    
                    <div className="terms-text">
                        <h2>SolWifTools - Terms of Service</h2>

                        <h3>1. Acceptance of Terms</h3>
                        <p>Welcome to SolWifTools ("Company," "we," "our," "us"). These Terms of Service ("Terms") govern your access to and use of our online software platform ("Service"), which facilitates cryptocurrency-related activities. By accessing or using our Service, you agree to be bound by these Terms. If you do not agree with any part of these Terms, you must not use our Service.</p>

                        <h3>2. Eligibility</h3>
                        <p>To use our Service, you must:</p>
                        <ul>
                            <li>Be at least 18 years old or the age of majority in your jurisdiction.</li>
                            <li>Provide accurate and complete information when registering an account.</li>
                            <li>Maintain the security of your account and be responsible for any activities under it.</li>
                            <li>Not engage in any unauthorized or illegal activities.</li>
                        </ul>

                        <h3>3. Account Registration and Security</h3>
                        <h4>3.1 Account Creation</h4>
                        <p>To use certain features of our Service, you may need to register for an account. You agree to provide accurate, complete, and up-to-date information during registration.</p>

                        <h4>3.2 Account Security</h4>
                        <p>You are responsible for maintaining the confidentiality of your account credentials. If you suspect any unauthorized use of your account, you must notify us immediately. We are not liable for any loss or damage caused by unauthorized access to your account.</p>

                        <h3>4. Use of the Service</h3>
                        <h4>4.1 Permitted Use</h4>
                        <p>You may use our Service only for lawful purposes and in accordance with these Terms.</p>

                        <h4>4.2 Prohibited Activities</h4>
                        <p>You agree not to:</p>
                        <ul>
                            <li>Use the Service for any illegal, fraudulent, or malicious activities.</li>
                            <li>Attempt to gain unauthorized access to our systems or interfere with the Service.</li>
                            <li>Use bots, scripts, or other automated methods to access or manipulate the Service.</li>
                            <li>Engage in any activity that violates the intellectual property rights of SolWifTools or third parties.</li>
                        </ul>

                        <h3>5. Fees and Payments</h3>
                        <p>Some features of our Service may require payment. By making a payment, you agree to our pricing, fees, and refund policies, which will be disclosed at the time of purchase.</p>

                        <h3>6. Termination of Account</h3>
                        <p>We reserve the right to terminate or suspend your account at our sole discretion, without notice, if we believe you have violated these Terms.</p>

                        <h3>7. Indemnification</h3>
                        <p>You agree to indemnify and hold harmless SolWifTools from any claims, damages, or expenses arising from your use of the Service or violation of these Terms.</p>

                        <h3>8. Intellectual Property Rights</h3>
                        <p>All content, features, and products on our website explicitly belong to SolWifTools. Users are prohibited from copying, distributing, or otherwise exploiting any part of our intellectual property without our prior written consent.</p>

                        <h3>9. User Content and Licensing</h3>
                        <p>If you submit content (e.g., reviews, feedback) on our platform, you grant us a non-exclusive, royalty-free license to use, reproduce, and display that content. Any negative or unjust reviews may result in the revocation of your license to use our platform without further notice.</p>

                        <h3>10. Refund Policy</h3>
                        <p>All sales are final. There will be no refunds under any circumstances once a product has been purchased.</p>

                        <h3>11. Limitation of Liability for Third-Party Services</h3>
                        <p>We are not liable for any conduct, products, or services provided by third parties, including those who may obtain your information through our Service.</p>

                        <h3>12. Marketing and Third-Party Data Sharing</h3>
                        <p>By using our Service, you agree that your email address may be used for marketing purposes and may be sold to third parties. If you do not consent to this, you must discontinue your use of our Service immediately.</p>

                        <h3>13. Force Majeure</h3>
                        <p>We are not responsible for any delays or failures in performance due to events beyond our reasonable control, including natural disasters, acts of government, or technical issues.</p>

                        <h3>14. Age Restrictions & Parental Consent</h3>
                        <p>Our services are strictly available only to individuals over the age of 18. We hold zero liability for any losses that may occur if a minor gains access to our platform.</p>

                        <h3>15. Contact Consent</h3>
                        <p>By signing up for our Service, you agree to receive communications regarding account activity, product updates, and marketing messages.</p>

                        <h3>16. Governing Law and Dispute Resolution</h3>
                        <p>These Terms shall be governed by and construed in accordance with the applicable laws of the jurisdiction in which SolWifTools operates. Any disputes arising from these Terms shall be resolved through arbitration in a mutually agreed-upon location.</p>

                        <h3>17. Changes to These Terms</h3>
                        <p>We may update these Terms from time to time. We will notify you of any significant changes, and your continued use of the Service after such changes means you accept the updated Terms.</p>

                        <h3>18. Contact Information</h3>
                        <p>If you have any questions about these Terms, please contact us at:</p>
                        <p>📧 Email: solwiftools@hotmail.com</p>
                        <p>🌐 Website: solwif.tools</p>
                    </div>

                    <div className="terms-modal-footer">
                        <button className="close-btn" onClick={onClose}>Close</button>
                        <button className="accept-btn" onClick={onAccept}>Accept Terms</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TermsModal; 