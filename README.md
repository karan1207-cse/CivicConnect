# CivicConnect 🏛️

**CivicConnect** is an enterprise-ready AI-powered Public Grievance Management Portal with full **Role-Based Access Control (RBAC)**, built using **Spring Boot 3** and **React + Vite**.

Every source file is strictly kept **under 200 lines maximum**, maintaining minimal, simple, and clean code while providing complete end-to-end functionality.

---

## 👥 User Roles & Permissions

| Role | Permissions & Capabilities |
| :--- | :--- |
| **CITIZEN** | Submit civic complaints with AI category & priority suggestions; view only their own complaints; track status & view officer resolution notes; update their own profile and password. |
| **OFFICER** | View complaints assigned to them; update status (`IN_PROGRESS`, `RESOLVED`, `REJECTED`); add resolution notes. Restricted from accessing other officers' complaints, assigning complaints, or managing users. |
| **ADMIN** | System-wide oversight: view all complaints; assign complaints to field officers; override complaint status; search users; activate/deactivate accounts; register new officers; review audit trail; monitor dashboard statistics. |

---

## 🛡️ Security & RBAC Enforcement

1. **Database-backed Roles**: Roles (`CITIZEN`, `OFFICER`, `ADMIN`) and `active` status stored directly in the database.
2. **Default Role**: Public registration defaults strictly to `CITIZEN`. Public registration as `ADMIN` or `OFFICER` is blocked by the backend.
3. **Spring Security & JWT**: Endpoints protected with `@PreAuthorize("hasRole(...)")` and `JwtAuthFilter`.
4. **Data Isolation**: Citizens cannot access complaints submitted by other users; officers cannot modify unassigned complaints.
5. **Account Status Check**: Deactivated accounts are prohibited from logging in.
6. **Audit Logs**: All administrative and officer actions (assignments, status updates, user activation/role changes) are persisted in `audit_logs`.

---

## 🔑 Pre-seeded Demo Accounts

On initial boot, the application seeds the following test accounts:

| Role | Email | Password |
| :--- | :--- | :--- |
| **ADMIN** | `admin@civicconnect.gov` | `Admin@123` |
| **OFFICER** | `officer@civicconnect.gov` | `Officer@123` |
| **CITIZEN** | `citizen@civicconnect.gov` | `Citizen@123` |

---

## 📁 Source File Line Counts (< 200 Lines Per File)

### Backend
- `AdminController.java`: 134 lines
- `ComplaintController.java`: 78 lines
- `OfficerController.java`: 70 lines
- `AuthController.java`: 62 lines
- `SecurityConfig.java`: 54 lines
- `Complaint.java`: 53 lines
- `ProfileController.java`: 43 lines
- `JwtAuthFilter.java`: 39 lines
- `User.java`: 39 lines
- `JwtUtil.java`: 37 lines
- `AuditLog.java`: 32 lines
- `CivicConnectApplication.java`: 28 lines
- `UserRepository.java`: 11 lines
- `ComplaintRepository.java`: 10 lines
- `AuditLogRepository.java`: 7 lines

### Frontend
- `AdminDashboard.jsx`: 186 lines
- `CitizenDashboard.jsx`: 88 lines
- `OfficerDashboard.jsx`: 83 lines
- `App.jsx`: 82 lines
- `index.css`: 78 lines
- `ProfileModal.jsx`: 47 lines
- `main.jsx`: 9 lines

---

## 🚀 Running the Project

### 1. Database
Import `database/schema.sql` into MySQL 8.0:
```sql
SOURCE database/schema.sql;
```

### 2. Backend (Spring Boot)
```shell
cd backend
mvn clean test
mvn spring-boot:run
```

### 3. Frontend (React)
```shell
cd frontend
npm install
npm run dev
```
Accessible at `http://localhost:5173`.
