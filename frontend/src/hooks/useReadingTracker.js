import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for tracking reading behavior metrics
 * Tracks timing, revisits, pauses, and navigation patterns
 */
export const useReadingTracker = (passageData) => {
  // Timing states
  const [startTime, setStartTime] = useState(null);
  const [currentSegmentStartTime, setCurrentSegmentStartTime] = useState(null);
  const [segmentTimes, setSegmentTimes] = useState([]);
  const [totalReadingTime, setTotalReadingTime] = useState(0);
  
  // Navigation states
  const [currentSegment, setCurrentSegment] = useState(0);
  const [visitedSegments, setVisitedSegments] = useState(new Set([0]));
  const [revisitDetails, setRevisitDetails] = useState([]);
  const [totalRevisits, setTotalRevisits] = useState(0);
  
  // Pause tracking
  const [pauseCount, setPauseCount] = useState(0);
  const [pauseDurations, setPauseDurations] = useState([]);
  const lastActivityRef = useRef(Date.now());
  const pauseStartRef = useRef(null);
  const pauseCheckIntervalRef = useRef(null);
  
  // Activity tracking
  const isActiveRef = useRef(true);
  
  /**
   * Initialize tracking when test starts
   */
  const startTracking = useCallback(() => {
    const now = Date.now();
    setStartTime(now);
    setCurrentSegmentStartTime(now);
    lastActivityRef.current = now;
    isActiveRef.current = true;
    
    // Start pause detection interval
    pauseCheckIntervalRef.current = setInterval(() => {
      const timeSinceLastActivity = Date.now() - lastActivityRef.current;
      
      // If inactive for >3 seconds and not already in pause
      if (timeSinceLastActivity > 3000 && !pauseStartRef.current) {
        pauseStartRef.current = lastActivityRef.current;
      }
      
      // If activity resumed after pause
      if (timeSinceLastActivity < 500 && pauseStartRef.current) {
        const pauseDuration = Date.now() - pauseStartRef.current;
        if (pauseDuration > 3000) { // Only count pauses longer than 3 seconds
          setPauseCount(prev => prev + 1);
          setPauseDurations(prev => [...prev, pauseDuration]);
        }
        pauseStartRef.current = null;
      }
    }, 500); // Check every 500ms
  }, []);
  
  /**
   * Track user activity (reset inactivity timer)
   */
  const trackActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    isActiveRef.current = true;
  }, []);
  
  /**
   * Navigate to next segment
   */
  const goToNextSegment = useCallback(() => {
    if (!passageData || currentSegment >= passageData.segments.length - 1) {
      return false;
    }
    
    // Record time spent on current segment
    const now = Date.now();
    const timeSpent = now - currentSegmentStartTime;
    setSegmentTimes(prev => {
      const newTimes = [...prev];
      newTimes[currentSegment] = timeSpent;
      return newTimes;
    });
    
    // Move to next segment
    const nextSegment = currentSegment + 1;
    setCurrentSegment(nextSegment);
    setCurrentSegmentStartTime(now);
    
    // Track if this is a new segment
    if (!visitedSegments.has(nextSegment)) {
      setVisitedSegments(prev => new Set([...prev, nextSegment]));
    }
    
    trackActivity();
    return true;
  }, [currentSegment, currentSegmentStartTime, passageData, visitedSegments, trackActivity]);
  
  /**
   * Navigate to previous segment (counts as revisit)
   */
  const goToPreviousSegment = useCallback(() => {
    if (currentSegment <= 0) {
      return false;
    }
    
    // Record time spent on current segment
    const now = Date.now();
    const timeSpent = now - currentSegmentStartTime;
    setSegmentTimes(prev => {
      const newTimes = [...prev];
      newTimes[currentSegment] = (newTimes[currentSegment] || 0) + timeSpent;
      return newTimes;
    });
    
    // Move to previous segment
    const prevSegment = currentSegment - 1;
    
    // This is a revisit
    setTotalRevisits(prev => prev + 1);
    setRevisitDetails(prev => [...prev, {
      segmentIndex: prevSegment,
      timestamp: now,
      duration: 0 // Will be updated when they leave again
    }]);
    
    setCurrentSegment(prevSegment);
    setCurrentSegmentStartTime(now);
    
    trackActivity();
    return true;
  }, [currentSegment, currentSegmentStartTime, trackActivity]);
  
  /**
   * Finish reading phase
   */
  const finishReading = useCallback(() => {
    const now = Date.now();
    
    // Record final segment time
    const timeSpent = now - currentSegmentStartTime;
    setSegmentTimes(prev => {
      const newTimes = [...prev];
      newTimes[currentSegment] = (newTimes[currentSegment] || 0) + timeSpent;
      return newTimes;
    });
    
    // Calculate total reading time
    const total = now - startTime;
    setTotalReadingTime(total);
    
    // Stop pause detection
    if (pauseCheckIntervalRef.current) {
      clearInterval(pauseCheckIntervalRef.current);
      pauseCheckIntervalRef.current = null;
    }
    
    return {
      totalReadingTime: total,
      segmentTimes: segmentTimes,
    };
  }, [currentSegment, currentSegmentStartTime, startTime, segmentTimes]);
  
  /**
   * Get complete tracking data
   */
  const getTrackingData = useCallback(() => {
    return {
      totalReadingTime,
      segmentTimes,
      totalRevisits,
      revisitDetails,
      pauseCount,
      pauseDurations,
      averagePauseDuration: pauseDurations.length > 0 
        ? Math.round(pauseDurations.reduce((a, b) => a + b, 0) / pauseDurations.length)
        : 0,
      longestPause: pauseDurations.length > 0 ? Math.max(...pauseDurations) : 0,
    };
  }, [totalReadingTime, segmentTimes, totalRevisits, revisitDetails, pauseCount, pauseDurations]);
  
  /**
   * Set up global activity listeners
   */
  useEffect(() => {
    const handleActivity = () => {
      trackActivity();
    };
    
    // Listen to various user interactions
    window.addEventListener('click', handleActivity);
    window.addEventListener('keypress', handleActivity);
    window.addEventListener('scroll', handleActivity);
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('touchstart', handleActivity);
    
    return () => {
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('keypress', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      
      // Clean up interval
      if (pauseCheckIntervalRef.current) {
        clearInterval(pauseCheckIntervalRef.current);
      }
    };
  }, [trackActivity]);
  
  return {
    // State
    currentSegment,
    totalSegments: passageData?.segments?.length || 0,
    isFirstSegment: currentSegment === 0,
    isLastSegment: currentSegment === (passageData?.segments?.length || 1) - 1,
    
    // Actions
    startTracking,
    goToNextSegment,
    goToPreviousSegment,
    finishReading,
    trackActivity,
    
    // Data
    getTrackingData,
    
    // Metrics (for display)
    pauseCount,
    totalRevisits,
  };
};

export default useReadingTracker;
