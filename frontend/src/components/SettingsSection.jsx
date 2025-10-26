import React, { useState } from 'react';
import { FaCog } from 'react-icons/fa';
import '../styles/SettingsSection.css';

const SettingsSection = () => {
  const [delay, setDelay] = useState("5050");
  const [minBuyAmount, setMinBuyAmount] = useState("0.05");
  const [maxBuyAmount, setMaxBuyAmount] = useState("0.1");

  return (
    <div className="settings-container">
      <div className="section-header">
        <FaCog className="section-icon" />
        <h2>Settings</h2>
      </div>
      
      <div className="setting-item">
        <label>RPC URL</label>
        <input type="text" placeholder="RPC URL" />
        <p>This URL allows applications to send requests and receive responses from the Solana blockchain</p>
      </div>

      <div className="setting-item">
        <label>WebSocket URL</label>
        <input type="text" placeholder="WebSocket URL" />
        <p>This URL establishes a continuous connection to the Solana blockchain, enabling real-time updates</p>
      </div>

      <div className="setting-item">
        <label>Delay</label>
        <input
          type="text"
          value={delay}
          placeholder="Delay"
          onChange={(e) => setDelay(e.target.value)}
        />
        <p>The delay for sniping dev wallet in ms. Where 1000 ms = 1 second</p>
      </div>

      <div className="setting-item">
        <label>Minimum Buy Amount</label>
        <input
          type="text"
          value={minBuyAmount}
          placeholder="Minimum Buy Amount"
          onChange={(e) => setMinBuyAmount(e.target.value)}
        />
        <p>The minimum buy amount for volume</p>
      </div>

      <div className="setting-item">
        <label>Maximum Buy Amount</label>
        <input
          type="text"
          value={maxBuyAmount}
          placeholder="Maximum Buy Amount"
          onChange={(e) => setMaxBuyAmount(e.target.value)}
        />
        <p>The maximum buy amount for volume</p>
      </div>

      <div className="settings-buttons">
        <button>Import</button>
        <button>Export</button>
        <button className="save-button">Save</button>
      </div>
    </div>
  );
};

export default SettingsSection; 