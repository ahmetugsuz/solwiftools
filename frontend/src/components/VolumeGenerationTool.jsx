import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { FaPlay, FaPause, FaClock, FaChartArea, FaRandom } from 'react-icons/fa';
import '../styles/VolumeGenerationTool.css';

const VolumeGenerationTool = () => {
  const [pattern, setPattern] = useState('gradual');
  const [schedule, setSchedule] = useState({
    startTime: '',
    endTime: '',
    interval: '5',
  });
  const [volumeSettings, setVolumeSettings] = useState({
    minAmount: '0.1',
    maxAmount: '1.0',
    totalVolume: '100',
  });
  const [isActive, setIsActive] = useState(false);

  // Sample data for preview chart
  const generatePreviewData = () => {
    const data = [];
    const hours = 24;
    let currentVolume = 0;

    for (let i = 0; i < hours; i++) {
      let volume;
      switch (pattern) {
        case 'gradual':
          volume = (i / hours) * parseFloat(volumeSettings.totalVolume);
          break;
        case 'spike':
          volume = Math.sin((i / hours) * Math.PI) * parseFloat(volumeSettings.totalVolume);
          break;
        case 'random':
          volume = Math.random() * parseFloat(volumeSettings.totalVolume);
          break;
        default:
          volume = parseFloat(volumeSettings.totalVolume) / hours;
      }
      currentVolume += volume;
      data.push({
        time: `${i}:00`,
        volume: volume.toFixed(2),
        cumulative: currentVolume.toFixed(2),
      });
    }
    return data;
  };

  const handlePatternChange = (newPattern) => {
    setPattern(newPattern);
  };

  const handleScheduleChange = (e) => {
    const { name, value } = e.target;
    setSchedule(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleVolumeSettingsChange = (e) => {
    const { name, value } = e.target;
    setVolumeSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const toggleActive = () => {
    setIsActive(!isActive);
  };

  return (
    <div className="volume-generation-tool">
      <div className="tool-header">
        <h2>Volume Generation</h2>
        <button 
          className={`toggle-button ${isActive ? 'active' : ''}`}
          onClick={toggleActive}
        >
          {isActive ? <FaPause /> : <FaPlay />}
          {isActive ? 'Stop' : 'Start'} Generation
        </button>
      </div>

      <div className="tool-content">
        <div className="settings-panel">
          <div className="settings-section">
            <h3>Pattern Selection</h3>
            <div className="pattern-buttons">
              <button 
                className={pattern === 'gradual' ? 'active' : ''} 
                onClick={() => handlePatternChange('gradual')}
              >
                <FaChartArea /> Gradual
              </button>
              <button 
                className={pattern === 'spike' ? 'active' : ''} 
                onClick={() => handlePatternChange('spike')}
              >
                <FaChartArea /> Spike
              </button>
              <button 
                className={pattern === 'random' ? 'active' : ''} 
                onClick={() => handlePatternChange('random')}
              >
                <FaRandom /> Random
              </button>
            </div>
          </div>

          <div className="settings-section">
            <h3>Schedule</h3>
            <div className="schedule-inputs">
              <div className="input-group">
                <label>Start Time</label>
                <input
                  type="time"
                  name="startTime"
                  value={schedule.startTime}
                  onChange={handleScheduleChange}
                />
              </div>
              <div className="input-group">
                <label>End Time</label>
                <input
                  type="time"
                  name="endTime"
                  value={schedule.endTime}
                  onChange={handleScheduleChange}
                />
              </div>
              <div className="input-group">
                <label>Interval (minutes)</label>
                <input
                  type="number"
                  name="interval"
                  value={schedule.interval}
                  onChange={handleScheduleChange}
                  min="1"
                  max="60"
                />
              </div>
            </div>
          </div>

          <div className="settings-section">
            <h3>Volume Settings</h3>
            <div className="volume-inputs">
              <div className="input-group">
                <label>Min Amount</label>
                <input
                  type="number"
                  name="minAmount"
                  value={volumeSettings.minAmount}
                  onChange={handleVolumeSettingsChange}
                  step="0.1"
                />
              </div>
              <div className="input-group">
                <label>Max Amount</label>
                <input
                  type="number"
                  name="maxAmount"
                  value={volumeSettings.maxAmount}
                  onChange={handleVolumeSettingsChange}
                  step="0.1"
                />
              </div>
              <div className="input-group">
                <label>Total Volume</label>
                <input
                  type="number"
                  name="totalVolume"
                  value={volumeSettings.totalVolume}
                  onChange={handleVolumeSettingsChange}
                  step="1"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="preview-panel">
          <h3>Volume Preview</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={generatePreviewData()}>
                <defs>
                  <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4B3FE8" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#4B3FE8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="volume" 
                  stroke="#4B3FE8" 
                  fill="url(#volumeGradient)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="cumulative" 
                  stroke="#6D64FF" 
                  fill="none" 
                  strokeDasharray="5 5"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VolumeGenerationTool; 