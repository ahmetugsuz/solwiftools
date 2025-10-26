import React from 'react';
import '../styles/ChartBackground.css';

const ChartBackground = () => {
  return (
    <div className="h-[100vh] relative">
      <div className="absolute inset-0 crypto-chart opacity-70">
        <svg
          viewBox="0 0 1000 1000"
          className="w-full h-full"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#4EA1FF" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#4EA1FF" stopOpacity="0" />
            </linearGradient>
            
            {/* Add glow effect */}
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Main chart line */}
          <path
            d="M0,500 Q250,300 500,450 T1000,380"
            fill="none"
            stroke="#ff5c5c"
            strokeWidth="3"
            className="chart-line"
            filter="url(#glow)"
          />
          
          {/* Gradient fill area */}
          <path
            d="M0,500 Q250,300 500,450 T1000,380 V600 H0 Z"
            fill="url(#chartGradient)"
            opacity="0.2"
          />
          
          {/* Animated point */}
          <circle
            cx="0"
            cy="0"
            r="5"
            fill="#ff0088"
            className="moving-point"
            filter="url(#glow)"
          />
        </svg>
      </div>
    </div>
  );
};

export default ChartBackground; 