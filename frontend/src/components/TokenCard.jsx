// src/components/TokenCard.js
import React from 'react';

const TokenCard = ({ name, symbol, liquidity }) => {
    return (
        <div className="bg-white p-4 rounded-md shadow-lg">
            <h3 className="text-xl font-semibold">{name}</h3>
            <p className="text-lg">{symbol}</p>
            <p className="text-sm text-gray-500">Liquidity: {liquidity}</p>
            <button className="mt-4 bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600">Manage</button>
        </div>
    );
};

export default TokenCard;
