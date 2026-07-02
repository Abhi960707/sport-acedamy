# Comprehensive Project Report
## Sports Academy Management System

This document outlines the entire flow of the application, role-based access controls, and the implementation details of recent features.

---

## 1. System Flow & Modules

The application is structured into several core workflows that seamlessly connect the frontend (React) to the backend (Node.js/Express) and database (MongoDB).

### A. Authentication Flow
1. **Signup/Registration**: New staff members register via the `/signup` route, providing their details and selecting a system Role (Superadmin, Admin, Coach, Accountant). The system verifies that the email does not already exist.
2. **Login**: Users authenticate with their credentials. A secure JWT (JSON Web Token) is issued and stored in `localStorage` to authorize subsequent requests.
3. **Session Management**: Forms automatically draft data to `localStorage` so work isn't lost if the user navigates away.

### B. Entity Management Flow
1. **Adding Records**: Authorized users can add new Games, Coaches, and Players. The backend automatically validates data types and strictly blocks duplicate contact numbers or emails.
2. **Auto-Calculations**: When adding a Player, the system dynamically fetches the fee for the selected sport. If the user enters a "Paying Fee", the system instantly calculates the remaining "Pending Fee".
3. **Draft Resumption**: If a user partially fills out a registration form and leaves, their progress is saved locally. Upon returning, the form auto-fills their previous inputs.

### C. Financial & Operations Flow
1. **Payment Processing**: Users can record fee payments against existing players. The system validates that the payment amount does not exceed the total outstanding balance.
2. **Attendance Tracking**: Daily attendance is logged for players. The UI provides a compact, easy-to-read list for quick reviews.

### D. Reporting & Auditing Flow
1. **Data Reports**: All entities (Players, Coaches, Games, Attendance, Payments) have dedicated Report views equipped with sorting, filtering, and searching capabilities.
2. **Exports**: Users can instantly export any report into highly formatted **PDFs** or **CSV** spreadsheets, or print them directly using specialized, compact print styling.
3. **Audit Logging**: Every critical action (Create, Update, Delete, Login, Logout) is recorded in the Audit Log, tracking exactly *who* (User Name/Email) performed the action and *when*.

---

## 2. Role-Based Access Control (RBAC)

The system utilizes a strict Role-Based Access Control mechanism. Different user roles have specific permissions to ensure security and data privacy.

### 👑 Superadmin
*The highest level of access.*
- **Scope**: Can view and manage data globally across the entire database.
- **Permissions**: Full read, write, update, and delete permissions for Players, Coaches, Games, and Payments.
- **Auditing**: Has full visibility into the Audit Log to monitor the actions of all other users.

### 🛡️ Admin
*The primary operational manager.*
- **Scope**: Restricted primarily to their own designated records (data marked with their specific `owner` ID).
- **Permissions**: Can add, update, and delete Players, Coaches, and Games. 
- **Validation**: They cannot accidentally alter fees or records belonging to other Admins.

###  whistle Coach
*Instructional staff.*
- **Scope**: Can view all active rosters and schedules.
- **Permissions**: **Read-Only access** to core reports (Player Lists, Coach Lists, Game Lists).
- **Restrictions**: Cannot add, update, or delete Player or Coach records to prevent unauthorized database modifications. 

### 📊 Accountant
*Financial staff.*
- **Scope**: Can view player records to verify financial standing.
- **Permissions**: **Read-Only access** to core directory reports. Primarily focused on managing the `Payment` and `Attendance` flows.
- **Restrictions**: Cannot arbitrarily delete user records or modify core configuration details without administrative oversight.

---

## 3. Implementation Details (Recent Additions)

The following features have been successfully implemented according to the strict constraints:

### A. Automated Fee Reminder
- **Node-cron Integration**: Installed and configured `node-cron`.
- **Daily Job**: Created `Utils/cronJobs.js` which schedules a job running daily at 10:00 AM.
- **Logic**: It fetches all players, checks if their `pendingFee` is greater than `0`, and triggers `sendFeeReminderEmail`.
- **SMTP Fallback**: Existing `email.js` gracefully handles missing SMTP credentials by falling back to log mode.

### B. Complete Notification Center
- **Unread Badge Fixed**: Updated `Navbar.js` to dynamically compute `unreadCount` by filtering for `!notif.isRead` instead of counting all notifications.
- **Mark as Read**: Retained existing robust logic which marks as read in the DB and removes it from the unread display to keep the UI clean.
- **Dynamic Notifications**: The backend dynamically generates pending fee reminders, new coach, and new player alerts efficiently.

### C. Audit Log Export & Refinement
- **Export Functionality**: Added "Export CSV" and "Print PDF" buttons directly to the existing `AuditLog.jsx` UI.
- **Utility Reuse**: Successfully imported and reused the existing `downloadCsv` utility from `reportExport.js` to ensure consistent formatting.
- **Industry Standard Terms**: Updated PDF and CSV headers to use user-friendly terms ("User Name" & "User Email") instead of technical terms ("Actor").
- **PDF Generation**: Used standard browser print capabilities (`window.print()`) which allows robust PDF generation without bloated third-party dependencies, preserving the UI aesthetic.

### D. Production Hardening
- **MongoDB Indexes**: Added indexes on `playerId`, `email`, `sportChosen`, `pendingFee`, `transactionId`, `paymentDate`, and `attendanceDate` across `players`, `payment`, and `attendance` schemas where they are queried heavily.
- **Duplicate Prevention**: Re-engineered validation in `players.js` and `coach.js` routers to aggressively manually intercept and reject duplicate emails and contact numbers before saving.
- **Graceful Error Logging**: Created `Utils/logger.js` which captures uncaught errors and logs them to a dedicated `logs/error.log` file, ensuring server stability without crashing abruptly.
- **Backup Configuration Placeholder**: Created `Utils/backup.js` as a placeholder for database backups.
- **Fallbacks**: Verified that SMTP and Cloudinary fallbacks are intact and functioning when credentials are not supplied.

---
**Verification**:
- ✓ Backend starts successfully with MongoDB connected and cron jobs running.
- ✓ Frontend builds successfully and components compile.
- ✓ Strict constraints followed (no renaming of collections, no major dependency changes, no UI disruptions).
