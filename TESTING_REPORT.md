# HRPlatform CRM — Frontend Testing Report

**Date:** 18 February 2026
**Tester:** Claude (automated browser testing via Claude in Chrome)
**Branch:** `claude/cranky-margulis`
**Environment:** Local development
- API: `http://localhost:4000/v1` (NestJS 11)
- Web: `http://localhost:3000` (Next.js 14)
- User: `newuser@test.com` (COMPANY_ADMIN)

---

## Summary

All 14 pages of the HRPlatform CRM were tested end-to-end from the browser UI. **20 bugs were found and fixed** across the API backend and Next.js frontend. Every CRUD flow was verified working after fixes.

---

## Pages Tested

| Page | URL | Status | Issues Found |
|------|-----|--------|--------------|
| Login | `/login` | ✅ Pass | — |
| Dashboard | `/dashboard` | ✅ Pass | `limit: 1000` exceeded API max |
| Employees | `/employees` | ✅ Pass | Create validation, Edit pre-populate |
| Departments | `/departments` | ✅ Pass | `_count` included soft-deleted |
| Designations | `/designations` | ✅ Pass | `_count` included soft-deleted |
| Attendance | `/attendance` | ✅ Pass | `limit: 1000` exceeded API max |
| Leave | `/leave` | ✅ Pass | `limit: 1000` exceeded API max |
| Leave Balance | `/leave/balance` | ✅ Pass | `limit: 1000` exceeded API max |
| Payroll | `/payroll` | ✅ Pass | `limit: 1000` exceeded API max, AES-256 key |
| Reports | `/reports` | ✅ Pass | `limit: 1000` exceeded API max |
| Users | `/users` | ✅ Pass | — |
| Audit Logs | `/audit-logs` | ✅ Pass | — |
| Settings | `/settings` | ✅ Pass | Company update field allowlist |
| Profile | `/profile` | ✅ Pass | Auth `/me` returned JWT payload only |

---

## 1. Login

The login page authenticates with email and password, stores the JWT `access_token` in both `localStorage` and cookies, and redirects to the Dashboard.

```
User: newuser@test.com
Role: COMPANY_ADMIN
```

**Fix applied:** API base URL fallback in `api-client.ts` corrected from `/api/v1` → `/v1`.

---

## 2. Dashboard

Shows real-time stats pulled from multiple API endpoints in parallel:

- **Total Employees:** 2 (2 active)
- **Present Today:** 0
- **Pending Leaves:** 0
- **Payroll Actions:** 1 (0 draft · 1 to pay)
- **Pending Leave Approvals** panel
- **Recent Payroll** panel (Alice Wonder ₹73,800 PROCESSED, Test Employee ₹60,000 PAID)
- **Today's Attendance** summary
- **Quick Actions**: Add Employee, Mark Attendance, Review Leaves, Process Payroll

**Fix applied:** `limit: 1000` → `limit: 100` to comply with backend DTO max validation.

---

## 3. Employees

### List View
Displays all employees in a table with Employee Code, Name/Email, Department, Designation, Status, and Actions.

| Employee Code | Name | Department | Designation | Status |
|---|---|---|---|---|
| EMP100 | Alice Wonder | Dev Team | Developer | Active |
| EMP005 | Test Worker | — | — | Active |

### Create Employee
Clicking **+ New Employee** opens a multi-section form. After filling required fields (Employee Code, First/Last Name, Work Email, Date of Joining, Employment Type), the employee is created and listed.

**Bug fixed:** Frontend was sending empty strings (`""`) for optional fields (dateOfBirth, departmentId, designationId, etc.), which the backend DTO validation rejected. Fixed by stripping empty/null/undefined values before the API call.

### Edit Employee
Clicking the edit action on any employee opens the edit form. The form must be pre-populated with existing data.

**Bug fixed:** The edit page passed only `employeeId` (no `initialData`), so the form was blank. Fixed by destructuring `employee` from the `useEmployee` hook and adding a `useEffect` that populates `formData` once the API response arrives. Date fields are formatted with `.split('T')[0]` for `<input type="date">` compatibility.

### Delete Employee
Clicking Delete with `confirm()` confirmed soft-deletes the employee. The record disappears from the list on reload.

---

## 4. Departments

### List View
Displays all departments with Code, Name, Description, Employee Count (live), and Edit/Delete actions.

| Code | Name | Description | Employees |
|---|---|---|---|
| DEV01 | Dev Team | — | 1 |
| HR01 | HR Department | Human Resources | 0 |
| MKT01 | Marketing | Marketing and Communications | 0 |
| QA01 | QA Department | Quality Assurance | 0 |
| SAL02 | Sales2 | Sales Department | 0 |

**Bug fixed:** The `_count.employees` query was counting soft-deleted employees. Added `{ where: { deletedAt: null } }` to all `_count` selects in `department.repository.ts`.

### Create
**+ New Department** opens an inline form. Created "Marketing" (MKT01) successfully.

### Edit / Delete
Edit pencil icon opens inline form pre-populated. Delete trash icon removes the department (with confirm dialog).

---

## 5. Designations

### List View
Displays all designations with Code, Title, Level badge, Salary Range, Employee Count, and Edit/Delete actions.

| Code | Title | Level | Employees |
|---|---|---|---|
| DEV | Developer | L3 · Mid | 1 |
| HRM | HR Manager | L5 · Lead | 0 |
| QAE | QA Engineer | L3 · Mid | 0 |

**Bug fixed:** Same `_count` soft-delete issue as departments. Fixed in `designation.repository.ts`.

### Create / Edit / Delete
All operations tested successfully. Created "Senior Project Manager" (PM01), edited title, deleted record.

---

## 6. Attendance Tracking

### List View
Displays attendance records with Date, Employee, Check In, Check Out, Hours, Status badge, and Edit/Delete actions.

Filters: Employee dropdown, Start Date, End Date, Status.

### Create Attendance
Clicking **+ Mark Attendance** opens an inline form with:
- Employee (dropdown)
- Date (pre-filled to today)
- Status (Present / Absent / Leave / Half Day / Weekend / Holiday)
- Check-In Time, Check-Out Time
- Work From Home checkbox
- Notes

**Bug fixed:** `limit: 1000` on the employees fetch caused `ApiError: limit must not be greater than 100`. Fixed to `limit: 100`.

**Test:** Created attendance for Alice Wonder (EMP100) — Status: PRESENT ✅

### Edit Attendance
Edit icon opens the form pre-populated. Changed status from PRESENT → HALF DAY successfully.

### Delete Attendance
Delete icon with `confirm()` removes the record. List refreshes automatically showing "No attendance records found."

---

## 7. Leave Management

### List View
Displays leave requests with Employee, Leave Type, Duration, Reason, Status badge, and action buttons (Approve, Reject, Cancel, Edit, Delete).

### Apply for Leave
**+ Apply for Leave** opens an inline form with:
- Employee (dropdown)
- Leave Type (Casual / Sick / Earned / Privilege / Compensatory / Maternity / Paternity / Loss of Pay)
- Start Date, End Date
- Total Days (number)
- Half Day checkbox
- Contact During Leave
- Reason (required)

**Test:** Applied casual leave for Alice Wonder (EMP100), 3 days (1 Mar – 3 Mar 2026), reason "Family vacation". Created with status PENDING ✅

### Approve Leave
Clicking the ✅ Approve icon changed status from **PENDING** → **APPROVED** (green badge). Action buttons reduced to Cancel only (approved leaves cannot be edited/deleted).

---

## 8. Leave Balance

Displays annual leave entitlements and usage per employee for the selected year.

**Annual Entitlements:**
| Type | Days |
|---|---|
| Casual | 12d |
| Sick | 12d |
| Earned | 15d |
| Privilege | 15d |
| Maternity | 180d |
| Paternity | 15d |

**Alice Wonder (EMP100 · Dev Team):** Used 3d | Total 249d | Remaining 246d

Color-coded progress bars (Healthy 🟢 / Low 🟠 / Critical 🔴) for each leave type.

**Fix applied:** `limit: 1000` → `limit: 100` on employees fetch.

---

## 9. Payroll Processing

### List View
Displays payroll records filtered by Month, Year, Employee, and Status. Shows Gross Salary, Deductions, Net Salary, Status badge, and action buttons.

### Create Payroll
**+ New Payroll** opens a multi-section form:
- **Pay Period:** Month, Year, Pay Date
- **Employee:** Dropdown
- **Earnings:** Basic Salary, HRA, Special Allowance, Other Allowances
- **Deductions:** PF Employee/Employer, ESI Employee/Employer, TDS, PT, Other Deductions
- **Attendance:** Days Worked, Days in Month, Leave Days, Absent Days, Overtime Hours
- **Bank Details:** Account Number, IFSC Code, Bank Name
- **Notes**
- **Live calculation:** Gross Salary, Total Deductions, Net Salary displayed in real-time

**Test payroll created for Alice Wonder (Feb 2026):**
| Field | Value |
|---|---|
| Basic Salary | ₹50,000 |
| HRA | ₹20,000 |
| Special Allowance | ₹10,000 |
| Other Allowances | ₹5,000 |
| **Gross Salary** | **₹85,000** |
| PF Employee | ₹6,000 |
| TDS | ₹5,000 |
| PT | ₹200 |
| **Total Deductions** | **₹11,200** |
| **Net Salary** | **₹73,800** |

Status: DRAFT ✅

**Bug fixed:** AES-256 encryption key was not being truncated to 32 bytes (64 hex chars). Fixed with `key.substring(0, 64)` in `payroll.service.ts`.

**Bug fixed:** `limit: 1000` → `limit: 100` on employees fetch.

### Process Payroll
Clicking **Process** changed status from **DRAFT** → **PROCESSED** (blue badge). Action buttons updated to "Mark Paid" and "Delete".

---

## 10. Reports

Allows generating HR reports by type and date range.

**Report Types:** Attendance Report, Leave Report, Payroll Report
**Filters:** Report Type, Employee, Start Date, End Date (or Month/Year for payroll)
**Action:** Generate Report button

**Fix applied:** `limit: 1000` → `limit: 100` on employees fetch.

---

## 11. User Management

Displays all users in the company with Name, Email, Role badge, Status, Last Login, and actions (Role dropdown + Deactivate button).

| Name | Email | Role | Status | Last Login |
|---|---|---|---|---|
| TestFirst TestLast | newuser@test.com | Company Admin | Active | 17 Feb 2026 |

Footer: "1 user in your company"

---

## 12. Audit Logs

Tracks all actions performed in the company with filters for Action, Resource Type, and User ID.

Sample audit trail from this testing session:

| Date & Time | Action | Resource | Status |
|---|---|---|---|
| 17 Feb 2026, 10:44 pm | Update | PAYROLL | ✅ Success |
| 17 Feb 2026, 10:44 pm | Create | PAYROLL | ✅ Success |
| 17 Feb 2026, 10:41 pm | Approve | LEAVE | ✅ Success |
| 17 Feb 2026, 10:41 pm | Create | LEAVE | ✅ Success |
| 17 Feb 2026, 10:40 pm | Create | ATTENDANCE | ✅ Success |

---

## 13. Settings

Manage company profile and configuration.

Shows plan badges (FREE, TRIAL) and company invite Code: **TESSG9P**.

Editable fields:
- Company Name, Industry
- Website, Email
- Phone, GSTIN
- Address fields, CIN

**Bug fixed:** Company `update()` in `company.repository.ts` accepted any `Record<string, any>` and passed it directly to Prisma, causing "Unknown field" errors for non-schema fields from the frontend form. Fixed with an explicit allowlist of valid Prisma Company model fields.

---

## 14. Profile

Allows updating personal information for the logged-in user.

Fields: First Name, Last Name, Phone
Also includes a Change Password section.

**Bug fixed:** The `/auth/me` endpoint was returning only the raw JWT payload (no `companyId`, `permissions`, `phone`). Fixed by adding a `getProfile(userId)` method in `auth.service.ts` that fetches the full user record from the database.

---

## Bugs Fixed — Complete List

### Backend (API — NestJS)

| # | File | Bug | Fix |
|---|---|---|---|
| 1 | `attendance.repository.ts` | `Promise.all` caused PgBouncer "prepared statement already exists" | Changed to `$transaction` |
| 2 | `audit.repository.ts` | Same PgBouncer issue | Changed to `$transaction` |
| 3 | `department.repository.ts` | Same PgBouncer issue | Changed to `$transaction` |
| 4 | `department.repository.ts` | `_count.employees` counted soft-deleted records | Added `{ where: { deletedAt: null } }` |
| 5 | `designation.repository.ts` | Same PgBouncer issue | Changed to `$transaction` |
| 6 | `designation.repository.ts` | `_count.employees` counted soft-deleted records | Added `{ where: { deletedAt: null } }` |
| 7 | `employee.repository.ts` | Same PgBouncer issue | Changed to `$transaction` |
| 8 | `leave.repository.ts` | Same PgBouncer issue | Changed to `$transaction` |
| 9 | `auth.controller.ts` | `/auth/me` returned JWT payload only | Call `authService.getProfile(userId)` |
| 10 | `auth.service.ts` | `getProfile` method missing | Added method to fetch full user from DB |
| 11 | `company.repository.ts` | Unknown Prisma fields caused update errors | Added explicit field allowlist |
| 12 | `employee.service.ts` | Relational/date fields in `encryptSensitiveFields` spread caused Prisma errors | Remove those keys before encryption |
| 13 | `payroll.service.ts` | AES-256 key not truncated to 32 bytes | Added `key.substring(0, 64)` |

### Frontend (Web — Next.js)

| # | File | Bug | Fix |
|---|---|---|---|
| 14 | `api-client.ts` | Base URL fallback pointed to `/api/v1` (wrong) | Changed to `/v1` |
| 15 | `register/route.ts` | Registration didn't return tokens or set cookies | Added `generateAccessToken`, `generateRefreshToken`, set cookies |
| 16 | `employee-form.tsx` | Optional fields sent as `""`, failing backend DTO validation | Strip empty/null/undefined values before API call |
| 17 | `employee-form.tsx` | Edit form blank (data not pre-populated) | Added `useEffect` to set `formData` when `employee` loads; format dates with `.split('T')[0]` |
| 18 | `attendance/page.tsx` | `limit: 1000` exceeded backend max of 100 | Changed to `limit: 100` |
| 19 | `dashboard/page.tsx` | `limit: 1000` exceeded backend max of 100 | Changed to `limit: 100` |
| 20 | `leave/page.tsx`, `leave/balance/page.tsx`, `payroll/page.tsx`, `reports/page.tsx` | `limit: 1000` exceeded backend max of 100 | Changed to `limit: 100` |

---

## CRUD Operations Verified

| Module | Create | Read | Update | Delete | Notes |
|---|---|---|---|---|---|
| Departments | ✅ | ✅ | ✅ | ✅ | Inline form |
| Designations | ✅ | ✅ | ✅ | ✅ | Inline form |
| Employees | ✅ | ✅ | ✅ | ✅ | Full multi-section form |
| Attendance | ✅ | ✅ | ✅ | ✅ | Inline form, list auto-refreshes |
| Leave | ✅ | ✅ | ✅ (Approve/Reject) | ✅ | Workflow: PENDING → APPROVED |
| Payroll | ✅ | ✅ | ✅ (Process/Mark Paid) | ✅ | Workflow: DRAFT → PROCESSED → PAID |

---

*Report generated after comprehensive end-to-end browser testing of HRPlatform CRM v1.0*
