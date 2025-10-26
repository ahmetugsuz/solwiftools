import React, { useState, useEffect } from 'react';
import { FaRegPlusSquare, FaPlay, FaPlus, FaWallet } from 'react-icons/fa';
import { MdClose, MdShoppingCart, MdComment, MdRocketLaunch } from 'react-icons/md';
import { toast } from 'react-toastify';
import '../styles/TasksSection.css';
import TaskService from '../services/TaskService';

const TasksSection = () => {
  // States for template creation and task management
  const [savedTemplates, setSavedTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [templateCreationStep, setTemplateCreationStep] = useState('select-type');
  const [selectedType, setSelectedType] = useState(null);
  const [selectedMode, setSelectedMode] = useState(null);
  const [availableWallets, setAvailableWallets] = useState([
    'Wallet 1', 'Wallet 2', 'Wallet 3', 'Wallet 4', 'Wallet 5'
  ]);

  // Template creation form
  const [templateForm, setTemplateForm] = useState({
    name: '',
    minBuyAmount: '0.1',
    maxBuyAmount: '0.5',
    delay: '1000',
    selectedWallet: '',
    comments: '',
    bumpAmount: '0.1'
  });

  // Task activation form (for Create Task button)
  const [taskForm, setTaskForm] = useState({
    tokenCA: '',
    delay: '1000'
  });

  // Define task types with icons for cards and emojis for sidebar
  const taskTypes = {
    buy: {
      name: 'Buy',
      icon: <MdShoppingCart />,
      sidebarIcon: '💰',
      description: 'Create automated buy tasks with different strategies',
      modes: [
        { id: 'micro', name: 'Micro Buy', description: 'Small regular buys to create steady upward price movement', emoji: '📈' },
        { id: 'volume', name: 'Gen Volume', description: 'Generate volume with automated buy patterns', emoji: '📊' },
        { id: 'human', name: 'Human Mode', description: 'Natural buying patterns that mimic human behavior', emoji: '🧑' }
      ]
    },
    sell: {
      name: 'Sell',
      icon: <FaWallet />,
      sidebarIcon: '💸',
      description: 'Automated selling strategies for profit taking',
      modes: [
        { id: 'all', name: 'Sell All', description: 'Sell entire balance across all wallets', emoji: '🗑️' },
        { id: 'single', name: 'Single Wallet Sell', description: 'Sell balance from a specific wallet', emoji: '👛' }
      ]
    },
    comment: {
      name: 'Comment',
      icon: <MdComment />,
      sidebarIcon: '💬',
      description: 'Automated comment posting with customizable messages',
      modes: []
    },
    bumpIt: {
      name: 'Bump It',
      icon: <MdRocketLaunch />,
      sidebarIcon: '🚀',
      description: 'Quick price impact buys to create momentum',
      modes: []
    }
  };

  const handleTemplateFormChange = (e) => {
    const { name, value } = e.target;
    setTemplateForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTaskFormChange = (e) => {
    const { name, value } = e.target;
    setTaskForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTypeSelect = (type) => {
    setSelectedType(type);
    setTemplateCreationStep('select-mode');
    if (taskTypes[type].modes.length === 0) {
      setTemplateCreationStep('configure');
    }
  };

  const handleModeSelect = (mode) => {
    setSelectedMode(mode);
    setTemplateCreationStep('configure');
  };

  const handleSaveTemplate = () => {
    if (!templateForm.name) {
      toast.error('Please enter a template name');
      return;
    }

    // Create new template
    const newTemplate = {
      id: Date.now(),
      type: selectedType,
      mode: selectedMode,
      ...templateForm
    };

    // Add template to saved templates
    setSavedTemplates(prev => [...prev, newTemplate]);
    
    // Reset and close
    setTemplateForm({
      name: '',
      minBuyAmount: '0.1',
      maxBuyAmount: '0.5',
      delay: '1000',
      selectedWallet: '',
      comments: '',
      bumpAmount: '0.1'
    });
    setShowTemplateModal(false);
    setTemplateCreationStep('select-type');
    setSelectedType(null);
    setSelectedMode(null);
    toast.success('Template saved successfully');
  };

  const handleCreateTask = () => {
    if (!taskForm.tokenCA) {
      toast.error('Please enter a token contract address');
      return;
    }

    if (!selectedTemplate) {
      toast.error('Please select a template first');
      return;
    }

    // Create new task instance from template
    const newTask = {
      ...selectedTemplate,
      tokenCA: taskForm.tokenCA,
      delay: taskForm.delay
    };

    // Add task using service
    TaskService.createTask(newTask);
    
    // Reset and close
    setTaskForm({
      tokenCA: '',
      delay: '1000'
    });
    setShowTaskModal(false);
    toast.success('Task created successfully');
  };

  const renderTaskTypeSelection = () => (
    <div className="task-type-selection">
      <h3>Select Task Type</h3>
      <div className="task-templates">
        {Object.entries(taskTypes).map(([type, info], index) => (
          <div 
            key={type}
            className="task-template-card"
            data-type={type}
            onClick={() => handleTypeSelect(type)}
          >
            <div className="template-icon">
              {info.icon}
            </div>
            <div className="template-info">
              <h4>{info.name}</h4>
              <p>{info.description}</p>
            </div>
            <div className="key-indicator">{index + 1}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderModeSelection = () => {
    const selectedTypeInfo = taskTypes[selectedType];
    return (
      <div className="task-type-selection mode-selection">
        <div className="selected-task-type">
          <div className="task-type-badge large">
            {selectedTypeInfo.icon}
            {selectedTypeInfo.name}
          </div>
          <button className="change-type-button" onClick={() => {
            setTemplateCreationStep('select-type');
            setSelectedType(null);
          }}>
            Change type
          </button>
        </div>
        <div className="task-templates">
          {selectedTypeInfo.modes.map((mode, index) => (
            <div 
              key={mode.id}
              className="task-template-card"
              data-mode={mode.id}
              onClick={() => handleModeSelect(mode.id)}
            >
              <div className="template-info">
                <h4>{mode.name}</h4>
                <p>{mode.description}</p>
              </div>
              <div className="key-indicator">{index + 1}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderTemplateConfiguration = () => {
    return (
      <div className="task-configuration">
        <div className="selected-task-type">
          <div className="task-type-badge large">
            {taskTypes[selectedType].icon}
            {taskTypes[selectedType].name}
            {selectedMode && ` - ${taskTypes[selectedType].modes.find(m => m.id === selectedMode)?.name}`}
          </div>
          <button className="change-type-button" onClick={() => {
            if (selectedMode) {
              setTemplateCreationStep('select-mode');
              setSelectedMode(null);
            } else {
              setTemplateCreationStep('select-type');
              setSelectedType(null);
            }
          }}>
            Change {selectedMode ? 'mode' : 'type'}
          </button>
        </div>

        <div className="form-group">
          <label>Task Group Name</label>
          <input
            type="text"
            name="name"
            value={templateForm.name}
            onChange={handleTemplateFormChange}
            placeholder="Enter task group name"
          />
        </div>
      </div>
    );
  };

  const renderTaskModal = () => (
    <div className="modal-backdrop">
      <div className={`create-task-modal ${selectedTemplate ? `task-type-${selectedTemplate.type}` : ''}`}>
        <div className="modal-header">
          <h2>Configure Task</h2>
          <button className="close-button" onClick={() => setShowTaskModal(false)}>
            <MdClose />
          </button>
        </div>
        
        <div className="modal-content">
          <div className="selected-task-type">
            <div className="task-type-badge large">
              {taskTypes[selectedTemplate.type].icon}
              {taskTypes[selectedTemplate.type].name}
              {selectedTemplate.mode && ` - ${taskTypes[selectedTemplate.type].modes.find(m => m.id === selectedTemplate.mode)?.name}`}
            </div>
          </div>

          <div className="form-group">
            <label>Task Name</label>
            <input
              type="text"
              name="taskName"
              value={taskForm.taskName || ''}
              onChange={handleTaskFormChange}
              placeholder="Enter task name"
            />
          </div>

          <div className="form-group">
            <label>Token Contract Address</label>
            <input
              type="text"
              name="tokenCA"
              value={taskForm.tokenCA}
              onChange={handleTaskFormChange}
              placeholder="Enter token CA"
            />
          </div>

          {/* Buy task specific fields */}
          {selectedTemplate.type === 'buy' && (
            <>
              <div className="form-group">
                <label>Min Buy Amount (SOL)</label>
                <input
                  type="number"
                  name="minBuyAmount"
                  value={taskForm.minBuyAmount || '0.1'}
                  onChange={handleTaskFormChange}
                  step="0.01"
                  min="0"
                />
              </div>
              <div className="form-group">
                <label>Max Buy Amount (SOL)</label>
                <input
                  type="number"
                  name="maxBuyAmount"
                  value={taskForm.maxBuyAmount || '0.5'}
                  onChange={handleTaskFormChange}
                  step="0.01"
                  min="0"
                />
              </div>
            </>
          )}

          {/* Sell task specific fields */}
          {selectedTemplate.type === 'sell' && selectedTemplate.mode === 'single' && (
            <div className="form-group">
              <label>Select Wallet</label>
              <select
                name="selectedWallet"
                value={taskForm.selectedWallet || ''}
                onChange={handleTaskFormChange}
              >
                <option value="">Choose a wallet</option>
                {availableWallets.map(wallet => (
                  <option key={wallet} value={wallet}>{wallet}</option>
                ))}
              </select>
            </div>
          )}

          {/* Comment task specific fields */}
          {selectedTemplate.type === 'comment' && (
            <div className="form-group">
              <label>Comments</label>
              <textarea
                name="comments"
                value={taskForm.comments || ''}
                onChange={handleTaskFormChange}
                placeholder="Enter comments (one per line)"
                rows="4"
              />
            </div>
          )}

          {/* Bump It task specific fields */}
          {selectedTemplate.type === 'bumpIt' && (
            <>
              <div className="form-group">
                <label>Bump Amount (SOL)</label>
                <input
                  type="number"
                  name="bumpAmount"
                  value={taskForm.bumpAmount || '0.1'}
                  onChange={handleTaskFormChange}
                  step="0.01"
                  min="0"
                />
              </div>
              <div className="form-group">
                <label>Select Wallet</label>
                <select
                  name="selectedWallet"
                  value={taskForm.selectedWallet || ''}
                  onChange={handleTaskFormChange}
                >
                  <option value="">Choose a wallet</option>
                  {availableWallets.map(wallet => (
                    <option key={wallet} value={wallet}>{wallet}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div className="form-group">
            <label>Delay (ms)</label>
            <input
              type="number"
              name="delay"
              value={taskForm.delay}
              onChange={handleTaskFormChange}
              min="0"
              step="100"
            />
          </div>
        </div>

        <div className="modal-buttons">
          <button className="cancel-button" onClick={() => setShowTaskModal(false)}>
            Cancel
          </button>
          <button className="create-button" onClick={handleCreateTask}>
            Create Task
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="tasks-section">
      {/* Left Sidebar */}
      <div className="tasks-sidebar">
        <div className="sidebar-header">
          <h2>Task Templates</h2>
          <button className="add-task-btn" onClick={() => setShowTemplateModal(true)}>
            <FaPlus />
          </button>
        </div>
        <div className="task-groups-list">
          {savedTemplates.map(template => (
            <div
              key={template.id}
              className={`task-group-item ${selectedTemplate?.id === template.id ? 'active' : ''}`}
              onClick={() => setSelectedTemplate(template)}
            >
              <div 
                className="pill-icon" 
                data-task-type={template.type}
                data-mode={template.mode || ''}
              >
                {template.mode ? 
                  taskTypes[template.type].modes.find(m => m.id === template.mode)?.emoji :
                  taskTypes[template.type].sidebarIcon
                }
              </div>
              <span>{template.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right Content Area */}
      <div className="tasks-content">
        <div className="content-header">
          <h1>{selectedTemplate ? taskTypes[selectedTemplate.type].name : 'Select Template'}</h1>
          <div className="header-actions">
            <button className="start-btn" disabled={!selectedTemplate}>
              <FaPlay /> Start All
            </button>
            <button 
              className="create-task-btn" 
              onClick={() => setShowTaskModal(true)}
              disabled={!selectedTemplate}
            >
              Configure Task
            </button>
          </div>
        </div>
        <div className="task-info">
          {selectedTemplate ? (
            <table className="task-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Mode</th>
                  <th>Token CA</th>
                  <th>Settings</th>
                  <th>Delay</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {/* Task rows will be populated here */}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">
              <p>Select a template from the sidebar or create a new one to get started</p>
            </div>
          )}
        </div>
      </div>

      {/* Template Creation Modal */}
      {showTemplateModal && (
        <div className="modal-backdrop">
          <div className={`create-task-modal ${selectedType ? `task-type-${selectedType}` : ''}`}>
            <div className="modal-header">
              <h2>
                {templateCreationStep === 'select-type' && 'Create New Template'}
                {templateCreationStep === 'select-mode' && 'Select Mode'}
                {templateCreationStep === 'configure' && 'Configure Template'}
              </h2>
              <button className="close-button" onClick={() => {
                setShowTemplateModal(false);
                setTemplateCreationStep('select-type');
                setSelectedType(null);
                setSelectedMode(null);
              }}>
                <MdClose />
              </button>
            </div>
            
            <div className="modal-content">
              {templateCreationStep === 'select-type' && renderTaskTypeSelection()}
              {templateCreationStep === 'select-mode' && renderModeSelection()}
              {templateCreationStep === 'configure' && renderTemplateConfiguration()}
            </div>

            {templateCreationStep === 'configure' && (
              <div className="modal-buttons">
                <button className="cancel-button" onClick={() => {
                  setShowTemplateModal(false);
                  setTemplateCreationStep('select-type');
                  setSelectedType(null);
                  setSelectedMode(null);
                }}>
                  Cancel
                </button>
                <button className="create-button" onClick={handleSaveTemplate}>
                  Save Template
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Task Creation Modal */}
      {showTaskModal && renderTaskModal()}
    </div>
  );
};

export default TasksSection; 