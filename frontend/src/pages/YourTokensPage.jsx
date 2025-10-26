import React, { useState } from 'react';
import TokenList from '../components/TokenList';
import { Link } from 'react-router-dom';

const YourTokensPage = () => {
  const [walletAddress] = useState(() => localStorage.getItem('walletAddress') || '');

  return (
    <div>
      <div className="container" style={{ marginTop: 100 }}>
        <TokenList 
          walletAddress={walletAddress}
          emptyMessage={
            <div style={{textAlign: 'center', marginTop: '40px'}}>
              <h2 className="text-xl font-semibold mb-2">No tokens found</h2>
              <p className="mb-4 text-gray-400">You don't have any tokens yet. Create your first token to get started!</p>
              <Link to="/Create-Token" className="inline-block px-6 py-2 rounded-full bg-blue-700 text-white font-semibold hover:bg-blue-800 transition">Create Token</Link>
            </div>
          }
        />
      </div>
    </div>
  );
};

export default YourTokensPage; 