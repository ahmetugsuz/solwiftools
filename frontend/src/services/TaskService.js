import { toast } from 'react-toastify';

// Simulated task storage - in a real app, this would use indexedDB or another storage solution
let tasks = [];
let taskExecutionIntervals = {};

/**
 * Generate a unique ID for new tasks
 * @returns {string} Unique ID
 */
const generateTaskId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

/**
 * Create a new task
 * @param {Object} taskData - The task configuration data
 * @returns {Object} The created task
 */
export const createTask = (taskData) => {
  const newTask = {
    ...taskData,
    id: generateTaskId(),
    status: 'waiting',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    logs: [],
    progress: 0,
    result: null
  };
  
  tasks.push(newTask);
  return newTask;
};

/**
 * Get all tasks
 * @returns {Array} List of all tasks
 */
export const getAllTasks = () => {
  return [...tasks];
};

/**
 * Get active tasks (waiting, running, paused)
 * @returns {Array} List of active tasks
 */
export const getActiveTasks = () => {
  return tasks.filter(task => ['waiting', 'running', 'paused'].includes(task.status));
};

/**
 * Get completed tasks
 * @returns {Array} List of completed tasks
 */
export const getCompletedTasks = () => {
  return tasks.filter(task => task.status === 'completed');
};

/**
 * Get a task by ID
 * @param {string} taskId - The task ID
 * @returns {Object|null} The task or null if not found
 */
export const getTaskById = (taskId) => {
  return tasks.find(task => task.id === taskId) || null;
};

/**
 * Update a task
 * @param {string} taskId - The task ID
 * @param {Object} updates - The updates to apply
 * @returns {Object|null} The updated task or null if not found
 */
export const updateTask = (taskId, updates) => {
  const taskIndex = tasks.findIndex(task => task.id === taskId);
  if (taskIndex === -1) return null;
  
  tasks[taskIndex] = {
    ...tasks[taskIndex],
    ...updates,
    updatedAt: new Date().toISOString()
  };
  
  return tasks[taskIndex];
};

/**
 * Delete a task
 * @param {string} taskId - The task ID
 * @returns {boolean} Success status
 */
export const deleteTask = (taskId) => {
  const taskIndex = tasks.findIndex(task => task.id === taskId);
  if (taskIndex === -1) return false;
  
  // Stop execution if running
  if (taskExecutionIntervals[taskId]) {
    clearInterval(taskExecutionIntervals[taskId]);
    delete taskExecutionIntervals[taskId];
  }
  
  tasks.splice(taskIndex, 1);
  return true;
};

/**
 * Start a task
 * @param {string} taskId - The task ID
 * @returns {Object|null} The updated task or null if not found
 */
export const startTask = (taskId) => {
  const task = getTaskById(taskId);
  if (!task) return null;
  
  const updatedTask = updateTask(taskId, { status: 'running' });
  executeTask(updatedTask);
  return updatedTask;
};

/**
 * Pause a task
 * @param {string} taskId - The task ID
 * @returns {Object|null} The updated task or null if not found
 */
export const pauseTask = (taskId) => {
  const task = getTaskById(taskId);
  if (!task) return null;
  
  if (taskExecutionIntervals[taskId]) {
    clearInterval(taskExecutionIntervals[taskId]);
    delete taskExecutionIntervals[taskId];
  }
  
  return updateTask(taskId, { status: 'paused' });
};

/**
 * Complete a task
 * @param {string} taskId - The task ID
 * @returns {Object|null} The updated task or null if not found
 */
export const completeTask = (taskId) => {
  const task = getTaskById(taskId);
  if (!task) return null;
  
  if (taskExecutionIntervals[taskId]) {
    clearInterval(taskExecutionIntervals[taskId]);
    delete taskExecutionIntervals[taskId];
  }
  
  return updateTask(taskId, { 
    status: 'completed',
    progress: 100,
    logs: [...task.logs, { timestamp: new Date().toISOString(), message: 'Task completed successfully.' }]
  });
};

/**
 * Duplicate a task
 * @param {string} taskId - The task ID
 * @returns {Object|null} The duplicated task or null if not found
 */
export const duplicateTask = (taskId) => {
  const task = getTaskById(taskId);
  if (!task) return null;
  
  // Create a new task based on existing one, but reset status and execution details
  const { id, status, createdAt, updatedAt, logs, progress, result, ...taskConfig } = task;
  
  return createTask({
    ...taskConfig,
    name: `${task.name} (Copy)`,
  });
};

/**
 * Add a log entry to a task
 * @param {string} taskId - The task ID
 * @param {string} message - The log message
 * @returns {Object|null} The updated task or null if not found
 */
export const addTaskLog = (taskId, message) => {
  const task = getTaskById(taskId);
  if (!task) return null;
  
  return updateTask(taskId, { 
    logs: [...task.logs, { timestamp: new Date().toISOString(), message }]
  });
};

/**
 * Execute a task based on its type
 * @param {Object} task - The task to execute
 */
const executeTask = (task) => {
  if (taskExecutionIntervals[task.id]) {
    clearInterval(taskExecutionIntervals[task.id]);
  }
  
  switch (task.type) {
    case 'micro-buy':
      executeMicroBuyTask(task);
      break;
    case 'generate-volume':
      executeVolumeGenerationTask(task);
      break;
    case 'bump-it':
      executeBumpItTask(task);
      break;
    default:
      console.error(`Unknown task type: ${task.type}`);
      updateTask(task.id, { 
        status: 'completed', 
        logs: [...task.logs, { timestamp: new Date().toISOString(), message: `Error: Unknown task type '${task.type}'` }]
      });
  }
};

/**
 * Execute a Micro Buy task
 * @param {Object} task - The task to execute
 */
const executeMicroBuyTask = (task) => {
  addTaskLog(task.id, 'Starting Micro Buy task...');
  
  let progress = 0;
  const buyInterval = parseFloat(task.buyInterval) || 30; // seconds
  const duration = parseFloat(task.duration) || 60; // minutes
  const totalIterations = Math.ceil((duration * 60) / buyInterval);
  const progressIncrement = 100 / totalIterations;
  let currentIteration = 0;
  
  // Simulate execution
  taskExecutionIntervals[task.id] = setInterval(() => {
    currentIteration++;
    
    // Simulate a buy transaction
    const amount = (parseFloat(task.buyAmount) || 0.1) + (Math.random() * 0.02 - 0.01);
    addTaskLog(task.id, `Executed buy of ${amount.toFixed(4)} ${task.token || 'TOKEN'}`);
    
    // Update progress
    progress += progressIncrement;
    updateTask(task.id, { progress: Math.min(99, progress) });
    
    // Check if the task is complete
    if (currentIteration >= totalIterations) {
      clearInterval(taskExecutionIntervals[task.id]);
      delete taskExecutionIntervals[task.id];
      completeTask(task.id);
      toast.success(`Task "${task.name}" completed successfully`);
    }
  }, buyInterval * 1000);
};

/**
 * Execute a Volume Generation task
 * @param {Object} task - The task to execute
 */
const executeVolumeGenerationTask = (task) => {
  addTaskLog(task.id, 'Starting Volume Generation task...');
  
  let progress = 0;
  const interval = parseFloat(task.interval) || 15; // seconds
  const duration = parseFloat(task.duration) || 30; // minutes
  const totalIterations = Math.ceil((duration * 60) / interval);
  const progressIncrement = 100 / totalIterations;
  let currentIteration = 0;
  
  // Simulate execution
  taskExecutionIntervals[task.id] = setInterval(() => {
    currentIteration++;
    
    // Simulate buy and sell transactions to generate volume
    const amount = (parseFloat(task.tradeAmount) || 0.5) + (Math.random() * 0.1 - 0.05);
    
    if (Math.random() > 0.5) {
      addTaskLog(task.id, `Executed buy of ${amount.toFixed(4)} ${task.token || 'TOKEN'}`);
    } else {
      addTaskLog(task.id, `Executed sell of ${amount.toFixed(4)} ${task.token || 'TOKEN'}`);
    }
    
    // Update progress
    progress += progressIncrement;
    updateTask(task.id, { progress: Math.min(99, progress) });
    
    // Check if the task is complete
    if (currentIteration >= totalIterations) {
      clearInterval(taskExecutionIntervals[task.id]);
      delete taskExecutionIntervals[task.id];
      completeTask(task.id);
      toast.success(`Task "${task.name}" completed successfully`);
    }
  }, interval * 1000);
};

/**
 * Execute a Bump It task
 * @param {Object} task - The task to execute
 */
const executeBumpItTask = (task) => {
  addTaskLog(task.id, 'Starting Bump It task...');
  addTaskLog(task.id, 'Analyzing current price action...');
  
  // Simulate initial analysis
  setTimeout(() => {
    addTaskLog(task.id, 'Setting up price floor...');
    updateTask(task.id, { progress: 10 });
    
    // Simulate bump execution
    setTimeout(() => {
      const targetPercentage = parseFloat(task.targetPercentage) || 5;
      addTaskLog(task.id, `Executing buy orders to achieve ${targetPercentage}% price increase`);
      updateTask(task.id, { progress: 30 });
      
      // Simulate gradual buys
      let currentProgress = 30;
      const buyCount = Math.floor(Math.random() * 3) + 3; // 3-5 buys
      const progressPerBuy = (90 - currentProgress) / buyCount;
      
      // Execute buys with random intervals
      const executeBuys = (buyIndex) => {
        if (buyIndex >= buyCount) {
          // All buys completed
          updateTask(task.id, { progress: 90 });
          addTaskLog(task.id, `Target price increase achieved. Adding liquidity to stabilize price.`);
          
          // Finalize task
          setTimeout(() => {
            completeTask(task.id);
            toast.success(`Task "${task.name}" completed successfully`);
          }, 3000);
          return;
        }
        
        const buyAmount = (parseFloat(task.buyAmount) || 0.2) + (Math.random() * 0.1 - 0.05);
        addTaskLog(task.id, `Executed strategic buy of ${buyAmount.toFixed(4)} ${task.token || 'TOKEN'}`);
        currentProgress += progressPerBuy;
        updateTask(task.id, { progress: currentProgress });
        
        // Schedule next buy
        const nextDelay = Math.floor(Math.random() * 3000) + 2000; // 2-5 seconds
        setTimeout(() => executeBuys(buyIndex + 1), nextDelay);
      };
      
      // Start the buy sequence
      executeBuys(0);
    }, 3000);
  }, 2000);
};

// Export default object for convenience
export default {
  createTask,
  getAllTasks,
  getActiveTasks,
  getCompletedTasks,
  getTaskById,
  updateTask,
  deleteTask,
  startTask,
  pauseTask,
  completeTask,
  duplicateTask,
  addTaskLog
}; 