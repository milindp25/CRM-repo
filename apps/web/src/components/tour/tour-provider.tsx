'use client';

import { useEffect, useRef, useCallback } from 'react';
import { driver, type Driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { dashboardTourSteps } from './tour-steps';
import { useTour } from './use-tour';

export function TourProvider({ children }: { children: React.ReactNode }) {
  const driverRef = useRef<Driver | null>(null);
  const { shouldAutoStart, markCompleted } = useTour();
  const hasInitialized = useRef(false);

  const startTour = useCallback(() => {
    if (driverRef.current) {
      driverRef.current.destroy();
    }

    const driverObj = driver({
      showProgress: true,
      animate: true,
      allowClose: true,
      overlayColor: 'rgba(0, 0, 0, 0.6)',
      stagePadding: 8,
      stageRadius: 12,
      popoverOffset: 12,
      popoverClass: 'hrplatform-tour-popover',
      steps: dashboardTourSteps,
      onHighlightStarted: (element: any) => {
        // Scroll the target element into view before driver.js positions the popover
        if (element?.element) {
          const el = typeof element.element === 'string'
            ? document.querySelector(element.element)
            : element.element;
          if (el instanceof HTMLElement) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
          }
        }
      },
      onDestroyStarted: () => {
        markCompleted();
        driverObj.destroy();
      },
      onDestroyed: () => {
        markCompleted();
      },
    });

    driverRef.current = driverObj;
    driverObj.drive();
  }, [markCompleted]);

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    // Small delay to ensure DOM elements are rendered
    const timer = setTimeout(() => {
      if (shouldAutoStart()) {
        startTour();
      }
    }, 1500);

    return () => {
      clearTimeout(timer);
      if (driverRef.current) {
        driverRef.current.destroy();
      }
    };
  }, [shouldAutoStart, startTour]);

  // Listen for custom event to start tour (fired from command palette, sidebar, etc.)
  useEffect(() => {
    const handler = () => startTour();
    document.addEventListener('start-product-tour', handler);
    return () => document.removeEventListener('start-product-tour', handler);
  }, [startTour]);

  return <>{children}</>;
}
