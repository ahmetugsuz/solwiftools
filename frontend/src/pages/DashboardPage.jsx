import React, { useState, useEffect } from 'react';
import { FaTasks, FaLayerGroup, FaWallet, FaCog, FaDownload, FaChevronLeft, FaChevronRight, FaEllipsisH, FaExchangeAlt } from 'react-icons/fa';
import { MdWifi } from 'react-icons/md';
import { BiCube } from 'react-icons/bi';
import { BsPlayFill } from 'react-icons/bs';
import '../styles/DashboardPage.css';
import { useNavigate } from 'react-router-dom';
import IncomeChart from '../components/IncomeChart';
import SettingsSection from '../components/SettingsSection';
import BundlerSection from '../components/BundlerSection';
import WalletsSection from '../components/WalletsSection';
import TasksSection from '../components/TasksSection';
import VolumeGenerationTool from '../components/VolumeGenerationTool';
import { toast } from 'react-toastify';

const DashboardPage = ({ walletAddress }) => {
    console.log('DashboardPage rendered');
    const [activeSection, setActiveSection] = useState('bundler');
    const [showSectionsDropdown, setShowSectionsDropdown] = useState(false);
    const [navigationHistory, setNavigationHistory] = useState(['bundler']);
    const [currentHistoryIndex, setCurrentHistoryIndex] = useState(0);
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkLicense = async () => {
            const jwt = localStorage.getItem('jwt');
            if (!walletAddress || !jwt) {
                toast.error('Please log in with your wallet to access the dashboard.');
                navigate('/');
                return;
            }
            try {
                const response = await fetch(`/api/license/dashboard/access`, {
                    headers: { Authorization: `Bearer ${jwt}` }
                });
                const data = await response.json();
                if (!data.hasAccess) {
                    toast.error('No valid license found. Please purchase a license to access the dashboard.');
                    navigate('/products');
                    return;
                }
                setIsLoading(false);
            } catch (error) {
                console.error('Error checking license:', error);
                toast.error('Error checking license status');
                navigate('/products');
            }
        };

        checkLicense();
    }, [walletAddress, navigate]);

    const handleClose = () => {
        navigate('/'); // Navigate to home page
    };
    // Navigation sections
    const sections = ['Bundler', 'Tasks', 'Wallets', 'Settings'];

    // Handle section change
    const handleSectionChange = (section) => {
        // Add new section to history, removing any forward history
        const newHistory = [...navigationHistory.slice(0, currentHistoryIndex + 1), section];
        setNavigationHistory(newHistory);
        setCurrentHistoryIndex(newHistory.length - 1);
        setActiveSection(section);
    };

    // Handle back navigation
    const handleBack = () => {
        if (currentHistoryIndex > 0) {
            setCurrentHistoryIndex(currentHistoryIndex - 1);
            setActiveSection(navigationHistory[currentHistoryIndex - 1]);
        }
    };

    // Handle forward navigation
    const handleForward = () => {
        if (currentHistoryIndex < navigationHistory.length - 1) {
            setCurrentHistoryIndex(currentHistoryIndex + 1);
            setActiveSection(navigationHistory[currentHistoryIndex + 1]);
        }
    };

    const renderTopNavigation = () => {
        return (
            <div className="top-navigation">
                <div className="navigation-controls">
                    <button className="nav-control">
                        <FaChevronLeft />
                    </button>
                    <button className="nav-control">
                        <FaEllipsisH />
                    </button>
                    <span className="nav-text">Dashboard</span>
                    <button className="nav-control">
                        <FaChevronRight />
                    </button>
                </div>
            </div>
        );
    };

    // Helper function to render section with icon
    const renderSectionContent = (section) => {
        switch(section) {
            case 'bundler':
                return (
                    <div className="section-header">
                        <h2>Bundler</h2>
                    </div>
                );
            case 'wallets':
                return (
                    <div className="section-header">
                        <h2>Wallets</h2>
                    </div>
                );
            

            case 'settings':
                return (
                    <div className="section-header">
                        <FaCog className="section-icon" />
                        <h2>Settings</h2>
                    </div>
                );
            default:
                return (
                    <div className="section-header">
                        <h2>{section}</h2>
                    </div>
                );
        }
    };

    const renderContent = () => {
        switch (activeSection) {
            case 'tasks':
                return <TasksSection />;
            case 'bundler':
                return <BundlerSection />;
            case 'wallets':
                return <WalletsSection />;
            
             
                
            case 'settings':
                return <SettingsSection />;
            default:
                return null;
        }
    };

    if (isLoading) {
        return <div style={{ color: 'red', background: 'white', zIndex: 9999, fontSize: 32 }}>DashboardPage loading...</div>;
    }

    return (
        <div className="dashboard-container">
            {/* Close Button */}
            <button className="mac-close-btn" onClick={handleClose}>
                <span className="close-icon">×</span>
            </button>
            {renderTopNavigation()}
            <nav className="main-navigation">
                {['Bundler', 'Tasks', 'Wallets', 'Settings'].map((section) => (
                    <button 
                        key={section}
                        className={`nav-button ${activeSection === section.toLowerCase().replace(' ', '-') ? 'active' : ''}`}
                        onClick={() => setActiveSection(section.toLowerCase().replace(' ', '-'))}
                    >
                        <span>{section}</span>
                    </button>
                ))}
            </nav>
            {renderContent()}
        </div>
    );
};

export default DashboardPage;