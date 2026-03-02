import type { DriveStep } from 'driver.js';

export const dashboardTourSteps: DriveStep[] = [
  {
    element: '[data-tour="sidebar-nav"]',
    popover: {
      title: 'Your Menu',
      description: 'Everything you need is here — your team, attendance, time off, payroll, and more. On phones, this menu tucks away to give you more space.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '[data-tour="header"]',
    popover: {
      title: 'Notifications & Profile',
      description: 'See your latest alerts by clicking the bell icon. You can also switch between light and dark mode, and access your profile here.',
      side: 'bottom',
      align: 'center',
    },
  },
  {
    element: '[data-tour="nav-employees"]',
    popover: {
      title: 'Your Team',
      description: 'Add new people, update their details, and keep track of everyone in your organization.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '[data-tour="nav-attendance"]',
    popover: {
      title: 'Attendance',
      description: 'See who\'s in the office, who\'s working from home, and record daily attendance for your team.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '[data-tour="nav-leave"]',
    popover: {
      title: 'Time Off',
      description: 'Request days off, approve or decline requests from your team, and check everyone\'s remaining balance.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '[data-tour="nav-payroll"]',
    popover: {
      title: 'Payroll',
      description: 'Calculate salaries, create payslips, set up pay structures, and handle taxes — all from one screen.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '[data-tour="dashboard-stats"]',
    popover: {
      title: 'Your Dashboard',
      description: 'See what\'s happening at a glance — how many people are in today, pending time off requests, and payroll status.',
      side: 'bottom',
      align: 'center',
    },
  },
  {
    element: '[data-tour="nav-settings"]',
    popover: {
      title: 'Settings',
      description: 'Update your company profile, set up integrations, configure time off rules, and customize how everything works.',
      side: 'right',
      align: 'start',
    },
  },
];
