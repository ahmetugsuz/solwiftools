import React from 'react';
import { FaPlay, FaPause, FaTrash, FaCopy, FaCheck } from 'react-icons/fa';
import { FiClock } from 'react-icons/fi';
import { MdSignalCellularAlt } from 'react-icons/md';
import { GiThorHammer } from 'react-icons/gi';
import { AiOutlineLineChart } from 'react-icons/ai';
import '../styles/TaskCard.css';

/**
 * TaskCard component displays an individual task card with actions
 */
const TaskCard = ({ 
  task, 
  onStart, 
  onPause, 
  onDelete, 
  onDuplicate, 
  onComplete 
}) => {
  // Format the timestamp for display
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  // Get the appropriate task icon based on task type
  const getTaskIcon = () => {
    switch (task.type) {
      case 'micro-buy':
        return <MdSignalCellularAlt className="task-icon buy" />;
      case 'generate-volume':
        return <AiOutlineLineChart className="task-icon volume" />;
      case 'bump-it':
        return <GiThorHammer className="task-icon bump" />;
      default:
        return <FiClock className="task-icon" />;
    }
  };

  // Get human-readable task type name
  const getTaskTypeName = () => {
    switch (task.type) {
      case 'micro-buy':
        return 'Micro Buy';
      case 'generate-volume':
        return 'Volume Gen';
      case 'bump-it':
        return 'Bump It';
      default:
        return task.type;
    }
  };

  // Get the appropriate CSS class based on task status
  const getStatusClass = () => {
    return `task-card ${task.status} ${task.type.replace('-', '')}`;
  };

  return (
    <div className={getStatusClass()}>
      <div className="task-card-header">
        <div className="task-type-badge">
          {getTaskIcon()}
          {getTaskTypeName()}
        </div>
        <div className="task-actions">
          {task.status === 'waiting' || task.status === 'paused' ? (
            <button 
              className="task-action-button start" 
              onClick={() => onStart(task.id)}
              title="Start Task"
            >
              <FaPlay />
            </button>
          ) : null}
          
          {task.status === 'running' ? (
            <button 
              className="task-action-button pause" 
              onClick={() => onPause(task.id)}
              title="Pause Task"
            >
              <FaPause />
            </button>
          ) : null}
          
          {task.status !== 'completed' ? (
            <button 
              className="task-action-button complete" 
              onClick={() => onComplete(task.id)}
              title="Complete Task"
            >
              <FaCheck />
            </button>
          ) : null}
          
          <button 
            className="task-action-button duplicate" 
            onClick={() => onDuplicate(task.id)}
            title="Duplicate Task"
          >
            <FaCopy />
          </button>
          
          <button 
            className="task-action-button delete" 
            onClick={() => onDelete(task.id)}
            title="Delete Task"
          >
            <FaTrash />
          </button>
        </div>
      </div>
      
      <div className="task-card-content">
        <h3>{task.name}</h3>
        
        <div className="task-details">
          {task.type === 'micro-buy' && (
            <>
              <div className="task-detail">
                <span className="detail-label">Amount:</span>
                <span className="detail-value">{task.buyAmount} SOL</span>
              </div>
              <div className="task-detail">
                <span className="detail-label">Interval:</span>
                <span className="detail-value">{task.buyInterval}s</span>
              </div>
              <div className="task-detail">
                <span className="detail-label">Duration:</span>
                <span className="detail-value">{task.duration} min</span>
              </div>
            </>
          )}
          
          {task.type === 'generate-volume' && (
            <>
              <div className="task-detail">
                <span className="detail-label">Trade Amount:</span>
                <span className="detail-value">{task.tradeAmount} SOL</span>
              </div>
              <div className="task-detail">
                <span className="detail-label">Interval:</span>
                <span className="detail-value">{task.interval}s</span>
              </div>
              <div className="task-detail">
                <span className="detail-label">Duration:</span>
                <span className="detail-value">{task.duration} min</span>
              </div>
            </>
          )}
          
          {task.type === 'bump-it' && (
            <>
              <div className="task-detail">
                <span className="detail-label">Target:</span>
                <span className="detail-value">+{task.targetPercentage}%</span>
              </div>
              <div className="task-detail">
                <span className="detail-label">Buy Amount:</span>
                <span className="detail-value">{task.buyAmount} SOL</span>
              </div>
            </>
          )}
          
          <div className="task-detail">
            <span className="detail-label">Token:</span>
            <span className="detail-value">{task.token || 'Default'}</span>
          </div>
          
          <div className="task-detail">
            <span className="detail-label">Created:</span>
            <span className="detail-value">{formatTimestamp(task.createdAt)}</span>
          </div>
        </div>
        
        <div className="task-status">
          <div className={`status-indicator ${task.status}`}></div>
          <div className="status-text">
            {task.status === 'running' ? (
              <>{task.status} • {Math.round(task.progress)}% complete</>
            ) : (
              task.status
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskCard; 