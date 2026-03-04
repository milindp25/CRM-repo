/**
 * GraphQL query definitions for aggregated page data
 * Each query replaces multiple REST calls with a single request
 */

// ─── Dashboard ─────────────────────────────────────────────────────────────────
// Replaces 10-18 REST calls with a single query
export const DASHBOARD_QUERY = `
  query DashboardData($widgetIds: [String!]!) {
    dashboardData(widgetIds: $widgetIds) {
      statsOverview {
        totalEmployees
        activeEmployees
        presentToday
        absentToday
        wfhToday
        pendingLeaves
        draftPayrolls
      }
      myAttendance {
        id
        status
        checkInTime
        checkOutTime
        workHours
        isWorkFromHome
      }
      myLeaves {
        id
        leaveType
        status
        totalDays
        startDate
        endDate
      }
      myPayslip {
        payPeriodMonth
        payPeriodYear
        netSalary
        status
      }
      pendingApprovals {
        id
        leaveType
        status
        totalDays
        startDate
        endDate
        employee {
          firstName
          lastName
        }
      }
      teamAttendance {
        present
        absent
        wfh
        onLeave
        total
      }
      teamLeaves {
        id
        leaveType
        status
        totalDays
        startDate
        endDate
        employee {
          firstName
          lastName
        }
      }
      announcements {
        id
        title
        content
        priority
        createdAt
      }
      kudos {
        id
        message
        sender {
          firstName
          lastName
        }
        recipient {
          firstName
          lastName
        }
      }
      birthdays {
        id
        firstName
        lastName
        dateOfBirth
      }
      analyticsOverview {
        totalEmployees
        attritionRate
        openPositions
      }
      recruitmentPipeline {
        id
        title
        department
        applicantCount
      }
      activityFeed {
        id
        action
        resourceType
        createdAt
        user {
          firstName
          lastName
        }
      }
    }
  }
`;

// ─── Leave Balance ─────────────────────────────────────────────────────────────
// Replaces 3 REST calls (employees, approved leaves, pending leaves) with 1
export const LEAVE_BALANCE_QUERY = `
  query LeaveBalancePage($year: Int!) {
    leaveBalancePage(year: $year) {
      employees {
        id
        employeeCode
        firstName
        lastName
        departmentName
      }
      leaves {
        id
        employeeId
        leaveType
        status
        totalDays
        startDate
        endDate
      }
    }
  }
`;

// ─── Directory ─────────────────────────────────────────────────────────────────
// Replaces 3 REST calls (directory, birthdays, anniversaries) with 1
export const DIRECTORY_QUERY = `
  query DirectoryPage($search: String) {
    directoryPage(search: $search) {
      employees {
        id
        firstName
        lastName
        workEmail
        workPhone
        department
        designation
        dateOfJoining
        dateOfBirth
        profilePhotoUrl
      }
      birthdays {
        id
        firstName
        lastName
        dateOfBirth
      }
      anniversaries {
        id
        firstName
        lastName
        dateOfJoining
      }
    }
  }
`;

// ─── Social ────────────────────────────────────────────────────────────────────
// Replaces 3 REST calls (announcements, kudos, employees) with 1
export const SOCIAL_PAGE_QUERY = `
  query SocialPage {
    socialPage {
      announcements {
        id
        title
        content
        priority
        isPinned
        createdAt
      }
      kudos {
        id
        message
        category
        senderName
        recipientName
        createdAt
      }
      employees {
        id
        firstName
        lastName
      }
    }
  }
`;
