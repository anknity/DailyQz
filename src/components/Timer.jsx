import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FiClock, FiAlertTriangle } from 'react-icons/fi'

/**
 * Timer Component
 * Displays countdown timer for tests
 * Supports both controlled (timeRemaining) and self-managed (initialTime) modes
 */
const Timer = ({ 
  timeRemaining, 
  initialTime, 
  onTimeUp, 
  onTick,
  isWarning = false 
}) => {
  // Use internal state for countdown when initialTime is provided
  const [internalTime, setInternalTime] = useState(initialTime || timeRemaining || 0);
  
  // Use timeRemaining prop if provided, otherwise use internal state
  const displayTime = timeRemaining !== undefined ? timeRemaining : internalTime;
  
  // Countdown effect when using initialTime mode
  useEffect(() => {
    if (initialTime !== undefined && initialTime > 0) {
      setInternalTime(initialTime);
    }
  }, [initialTime]);
  
  useEffect(() => {
    // Only run countdown if in self-managed mode (initialTime was provided)
    if (timeRemaining !== undefined) return; // Controlled mode - parent handles countdown
    
    if (internalTime <= 0) {
      if (onTimeUp) onTimeUp();
      return;
    }
    
    const interval = setInterval(() => {
      setInternalTime(prev => {
        const newTime = prev - 1;
        if (onTick) onTick(newTime);
        if (newTime <= 0) {
          if (onTimeUp) onTimeUp();
          clearInterval(interval);
        }
        return newTime;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [internalTime, timeRemaining, onTimeUp, onTick]);
  
  // Calculate minutes and seconds safely
  const safeTime = Math.max(0, displayTime || 0);
  const minutes = Math.floor(safeTime / 60);
  const seconds = Math.floor(safeTime % 60);
  
  // Determine warning state (less than 5 minutes)
  const showWarning = safeTime <= 300 || isWarning;
  const showCritical = safeTime <= 60;

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-lg font-bold transition-all duration-300 ${
        showCritical
          ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 pulse-warning'
          : showWarning
          ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
          : 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
      }`}
    >
      {showCritical ? (
        <FiAlertTriangle className="w-5 h-5 animate-pulse" />
      ) : (
        <FiClock className="w-5 h-5" />
      )}
      <span>
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </span>
    </motion.div>
  )
}

export default Timer
