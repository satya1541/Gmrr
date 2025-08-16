import { useEffect, useCallback } from 'react';
import introJs from 'intro.js';
import 'intro.js/introjs.css';

const TOUR_COMPLETED_KEY = 'toxishield-tour-completed';
const ADMIN_TOUR_COMPLETED_KEY = 'toxishield-admin-tour-completed';
const HISTORY_TOUR_COMPLETED_KEY = 'toxishield-history-tour-completed';

interface TourStep {
  element: string;
  intro: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

const dashboardTourSteps: TourStep[] = [
  {
    element: '[data-tour="logo"]',
    intro: 'Welcome to ToxiShield-X! This is your IoT monitoring dashboard. Click on the logo anytime to return to the dashboard.',
    position: 'bottom'
  },
  {
    element: '[data-tour="navigation"]',
    intro: 'Use these navigation tabs to switch between Dashboard, History, and Admin sections.',
    position: 'bottom'
  },
  {
    element: '[data-tour="connection-status"]',
    intro: 'This indicator shows your real-time connection status. Green means you\'re receiving live data updates.',
    position: 'bottom'
  },
  {
    element: '[data-tour="device-cards"]',
    intro: 'Here you\'ll see all your connected IoT devices. Each card shows device status, latest readings, and real-time data.',
    position: 'top'
  },
  {
    element: '[data-tour="admin-section"]',
    intro: 'Access the Admin section to manage devices, view visitor activity, configure settings, and export data.',
    position: 'bottom'
  },
  {
    element: '[data-tour="gmr-logo"]',
    intro: 'This is the GMR Group logo. Click it to visit their website in a new tab.',
    position: 'left'
  }
];

const adminTourSteps: TourStep[] = [
  {
    element: '[data-tour="admin-header"]',
    intro: 'Welcome to the Admin Dashboard! This is your control center for managing all IoT devices and system settings.',
    position: 'bottom'
  },
  {
    element: '[data-tour="add-device-btn"]',
    intro: 'Click here to add new IoT devices to your monitoring system. You can configure MQTT brokers, device IDs, and connection settings.',
    position: 'bottom'
  },
  {
    element: '[data-tour="admin-tabs"]',
    intro: 'Use these tabs to navigate between Device Management, Visitor Tracking, and System Settings.',
    position: 'bottom'
  },
  {
    element: '[data-tour="devices-table"]',
    intro: 'This table shows all your registered devices with their status, MQTT broker info, and last activity. You can edit or delete devices using the action buttons.',
    position: 'top'
  },
  {
    element: '[data-tour="visitor-tab"]',
    intro: 'Switch to Visitor Tracking to monitor website visitors, their locations, browsers, and activity patterns in real-time.',
    position: 'bottom'
  },
  {
    element: '[data-tour="system-tab"]',
    intro: 'The System Settings tab lets you configure automated data cleanup, manage database maintenance, and adjust system parameters.',
    position: 'bottom'
  }
];

const historyTourSteps: TourStep[] = [
  {
    element: '[data-tour="history-header"]',
    intro: 'Welcome to the Device History page! Here you can view detailed historical data from all your IoT devices and export it for analysis.',
    position: 'bottom'
  },
  {
    element: '[data-tour="history-filters"]',
    intro: 'Use these filters to select which device you want to analyze and set date ranges to narrow down your search to specific time periods.',
    position: 'bottom'
  },
  {
    element: '[data-tour="device-selector"]',
    intro: 'Select any of your registered devices from this dropdown. The history data will load automatically once you make a selection.',
    position: 'bottom'
  },
  {
    element: '[data-tour="date-filters"]',
    intro: 'Set start and end dates to filter the historical data to specific time ranges. Leave blank to see all available data.',
    position: 'bottom'
  },
  {
    element: '[data-tour="export-button"]',
    intro: 'Export your filtered data to an Excel file for offline analysis, reports, or sharing with your team.',
    position: 'bottom'
  },
  {
    element: '[data-tour="data-table"]',
    intro: 'This table shows the historical sensor readings with timestamps, alcohol levels, and alert status. Use pagination controls to navigate through large datasets.',
    position: 'top'
  }
];

export function useTour() {
  const hasTourCompleted = useCallback((tourType: 'dashboard' | 'admin' | 'history' = 'dashboard') => {
    const key = tourType === 'admin' ? ADMIN_TOUR_COMPLETED_KEY : 
                tourType === 'history' ? HISTORY_TOUR_COMPLETED_KEY : TOUR_COMPLETED_KEY;
    return localStorage.getItem(key) === 'true';
  }, []);

  const markTourCompleted = useCallback((tourType: 'dashboard' | 'admin' | 'history' = 'dashboard') => {
    const key = tourType === 'admin' ? ADMIN_TOUR_COMPLETED_KEY : 
                tourType === 'history' ? HISTORY_TOUR_COMPLETED_KEY : TOUR_COMPLETED_KEY;
    localStorage.setItem(key, 'true');
  }, []);

  const startTour = useCallback((tourType: 'dashboard' | 'admin' | 'history' = 'dashboard') => {
    // Only start tour if it hasn't been completed
    if (hasTourCompleted(tourType)) {
      return;
    }

    const steps = tourType === 'admin' ? adminTourSteps : 
                  tourType === 'history' ? historyTourSteps : dashboardTourSteps;
    const intro = introJs();
    
    intro.setOptions({
      steps,
      showProgress: true,
      showBullets: false,
      exitOnOverlayClick: false,
      exitOnEsc: true,
      nextLabel: 'Next →',
      prevLabel: '← Back',
      doneLabel: 'Get Started!',
      skipLabel: 'Skip',
      tooltipClass: 'customTooltip',
      highlightClass: 'customHighlight',
      disableInteraction: false,
      scrollToElement: true,
      scrollPadding: 30,
      overlayOpacity: 0.7,
    });

    intro.onbeforechange(() => {
      // Ensure elements are visible before highlighting
      return true;
    });

    intro.oncomplete(() => {
      markTourCompleted(tourType);
    });

    intro.onexit(() => {
      markTourCompleted(tourType);
    });

    intro.start();
  }, [hasTourCompleted, markTourCompleted]);

  const resetTour = useCallback((tourType: 'dashboard' | 'admin' | 'history' | 'all' = 'dashboard') => {
    if (tourType === 'all') {
      localStorage.removeItem(TOUR_COMPLETED_KEY);
      localStorage.removeItem(ADMIN_TOUR_COMPLETED_KEY);
      localStorage.removeItem(HISTORY_TOUR_COMPLETED_KEY);
    } else {
      const key = tourType === 'admin' ? ADMIN_TOUR_COMPLETED_KEY : 
                  tourType === 'history' ? HISTORY_TOUR_COMPLETED_KEY : TOUR_COMPLETED_KEY;
      localStorage.removeItem(key);
    }
  }, []);

  return {
    startTour,
    resetTour,
    hasTourCompleted,
    markTourCompleted
  };
}