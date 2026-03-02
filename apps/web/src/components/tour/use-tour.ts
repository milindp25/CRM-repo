'use client';

import { useCallback, useEffect, useState } from 'react';

const TOUR_COMPLETED_KEY = 'hrplatform-tour-completed';
const TOUR_TRIGGER_KEY = 'hrplatform-start-tour';

export function useTour() {
  const [hasCompletedTour, setHasCompletedTour] = useState(true); // default true to prevent flash

  useEffect(() => {
    const completed = localStorage.getItem(TOUR_COMPLETED_KEY);
    setHasCompletedTour(completed === 'true');
  }, []);

  const shouldAutoStart = useCallback(() => {
    // Auto-start if user hasn't completed the tour and it's their first visit
    // OR if the onboarding page set the trigger flag
    const trigger = localStorage.getItem(TOUR_TRIGGER_KEY);
    if (trigger === 'true') {
      localStorage.removeItem(TOUR_TRIGGER_KEY);
      return true;
    }
    return !hasCompletedTour;
  }, [hasCompletedTour]);

  const markCompleted = useCallback(() => {
    localStorage.setItem(TOUR_COMPLETED_KEY, 'true');
    setHasCompletedTour(true);
  }, []);

  const resetTour = useCallback(() => {
    localStorage.removeItem(TOUR_COMPLETED_KEY);
    setHasCompletedTour(false);
  }, []);

  return {
    hasCompletedTour,
    shouldAutoStart,
    markCompleted,
    resetTour,
  };
}
