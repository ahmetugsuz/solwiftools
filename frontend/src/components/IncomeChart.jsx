import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const dataOptions = {
  'Last 7 days': [
    { date: 'Apr 1', buyIncome: 400, sellIncome: 200 },
    { date: 'Apr 2', buyIncome: 300, sellIncome: 150 },
    { date: 'Apr 3', buyIncome: 500, sellIncome: 250 },
    { date: 'Apr 4', buyIncome: 200, sellIncome: 100 },
    { date: 'Apr 5', buyIncome: 700, sellIncome: 350 },
    { date: 'Apr 6', buyIncome: 600, sellIncome: 300 },
    { date: 'Apr 7', buyIncome: 800, sellIncome: 400 },
  ],
  'Last 30 days': [
    // Add more data for 30 days
  ],
  'Last 3 months': [
    // Add more data for 3 months
  ],
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ backgroundColor: '#000', padding: '10px', borderRadius: '5px', color: '#fff' }}>
        <p>{label}</p>
        <p style={{ color: '#4CAF50' }}>Buy Income: {payload[0].value}</p>
        <p style={{ color: '#FF0000' }}>Sell Income: {payload[1].value}</p>
      </div>
    );
  }
  return null;
};

const IncomeChart = () => {
  const [selectedOption, setSelectedOption] = useState('Last 7 days');
  const data = dataOptions[selectedOption];

  return (
    <div className="chart-container">
      <div className="chart-header">
        <h2>Solana Wallet Income</h2>
        <select
          value={selectedOption}
          onChange={(e) => setSelectedOption(e.target.value)}
        >
          {Object.keys(dataOptions).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorBuy" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4CAF50" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#4CAF50" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorSell" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#FF0000" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#FF0000" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Area type="monotone" dataKey="buyIncome" stroke="#4CAF50" fill="url(#colorBuy)" />
          <Area type="monotone" dataKey="sellIncome" stroke="#FF0000" fill="url(#colorSell)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default IncomeChart; 