# Phase 2: Security & Authentication Specification

**Document:** `specs/06-security-and-authentication.md`  
**Purpose:** Specify authentication, role-based access control (RBAC), token lifecycle, session persistence in Electron, and LAN defense-in-depth.

---

## 1. Authentication Architecture & Credential Management

The existing robust authentication model is preserved in its entirety, keeping passwords safe and preventing credential theft over the local network:

```mermaid
flowchart TD
    User["Staff Member (Doctor / Receptionist / Admin)"]
    LoginUI["Electron Renderer Login Screen"]
    AuthAction["Next.js Server Action (auth.action.ts)"]
    ExpressAuth["Express Central Auth (/api/v1/auth/login)"]
    Argon2Verify["Argon2 Password Hash Verification"]
    MongoUsers[("MongoDB Users Collection")]
    TokenGen["JWT Token Pair Generation<br>(Access: 15m, Refresh: 7d)"]
    NextAuthStore["NextAuth Encrypted Session Store"]

    User -->|1. Username & Password| LoginUI
    LoginUI -->|2. Form Submit| AuthAction
    AuthAction -->|3. POST /auth/login over LAN| ExpressAuth
    ExpressAuth -->|4. Find active user| MongoUsers
    MongoUsers -->|5. Return user document| ExpressAuth
    ExpressAuth -->|6. Verify hash| Argon2Verify
    Argon2Verify -->|7. Hash matches| TokenGen
    TokenGen -->|8. Issue tokens| ExpressAuth
    ExpressAuth -->|9. JSON Response {accessToken, user}| AuthAction
    AuthAction -->|10. Establish Session| NextAuthStore
    NextAuthStore -->|11. Authorized Redirect| LoginUI
```

### 1.1 Password Security
- **Hashing Algorithm:** Argon2id (`argon2` v0.31.2).
- Plaintext passwords are never logged, echoed to terminals, or stored in persistent files.
- Seed default accounts are protected with high-entropy passwords and marked for mandatory change on first deployment.

### 1.2 Token Architecture & Lifecycle
- **Access Token:**
  - Standard HMAC-SHA256 JWT signed with `JWT_ACCESS_SECRET`.
  - Expiration: **15 minutes** (900 seconds).
  - Payload claims: `{ sub: userId, role: userRole, username: username }`.
- **Refresh Token & Reuse Detection:**
  - High-entropy cryptographic random bytes (64-character hex).
  - Expiration: **7 days** (604,800 seconds).
  - Stored in MongoDB `RefreshToken` collection hashed with SHA-256.
  - Organized by `family` UUID. If a revoked or reused refresh token is presented, all refresh tokens in that family are immediately revoked (preventing token hijacking).

---

## 2. Role-Based Access Control (RBAC) Matrix

Authorization is strictly enforced on the central backend at the controller and service layers. **The backend never trusts a role string provided in the request body from the client.**

| Feature / Resource | HTTP Method & Route | ADMIN | DOCTOR | RECEPTION | Enforcement Mechanism |
|---|---|:---:|:---:|:---:|---|
| **User Management** | `GET/POST/PUT /api/v1/users` | ✅ Full | ❌ 403 | ❌ 403 | `requireRoles('ADMIN')` |
| **Doctors Directory**| `GET /api/v1/users/doctors` | ✅ Read | ✅ Read | ✅ Read | `requireRoles('ADMIN', 'DOCTOR', 'RECEPTION')` |
| **Patient Registration**| `POST /api/v1/patients` | ✅ Create | ✅ Create | ✅ Create | `requireRoles('ADMIN', 'DOCTOR', 'RECEPTION')` |
| **Patient Info (Bio)**| `GET /api/v1/patients/:id` | ✅ Read | ✅ Read | ✅ Read | `requireRoles('ADMIN', 'DOCTOR', 'RECEPTION')` |
| **Appointment Booking**| `POST /api/v1/appointments` | ✅ Full | ✅ Full | ✅ Full | `requireRoles('ADMIN', 'DOCTOR', 'RECEPTION')` |
| **Queue Management** | `POST /api/v1/queue/*` | ✅ Full | ✅ Call next | ✅ Full | Role guards in `queue.controller.ts` |
| **Clinical Exam (ENT)**| `POST/PUT /api/v1/visits/*` | ✅ Read | ✅ **Full** | ❌ **403 Strict** | `requireRoles('DOCTOR')` |
| **Prescription Issue**| `POST /api/v1/prescriptions`| ❌ Read | ✅ **Full** | ❌ **403 Strict** | `requireRoles('DOCTOR')` |
| **Financial Payments**| `POST /api/v1/payments/*` | ✅ Full | ❌ **403 Strict**| ✅ **Full** | `requireRoles('ADMIN', 'RECEPTION')` |
| **Petty Cash Expenses**| `POST /api/v1/expenses` | ✅ Full | ❌ **403 Strict**| ✅ Record | `requireRoles('ADMIN', 'RECEPTION')` |
| **Expense Approval** | `PUT /api/v1/expenses/:id` | ✅ Approve | ❌ 403 | ❌ 403 | `requireRoles('ADMIN')` |
| **Daily Shift Closing**| `POST /api/v1/closing` | ✅ Reopen | ❌ **403 Strict**| ✅ Close | `requireRoles('ADMIN', 'RECEPTION')` |
| **Financial Reports** | `GET /api/v1/reports/*` | ✅ Full | ❌ **403 Strict**| ❌ **403 Strict**| `requireRoles('ADMIN')` |
| **System Settings** | `PUT /api/v1/settings` | ✅ Full | ❌ 403 | ❌ 403 | `requireRoles('ADMIN')` |
| **Audit Logs** | `GET /api/v1/audit-logs` | ✅ Full | ❌ 403 | ❌ 403 | `requireRoles('ADMIN')` |

### 2.1 Medical Privacy Invariant
Receptionists are legally and architecturally barred from viewing the doctor's clinical visit notes, patient symptoms, ENT examination canvas drawings, or drug prescription details. Attempting to access `/api/v1/visits/:id` with a RECEPTION token returns HTTP 403 Forbidden.

### 2.2 Financial Integrity Invariant
Doctors are legally and architecturally barred from editing payments, recording discounts, viewing cash drawer balances, or approving clinic expenditures. Attempting to access financial endpoints with a DOCTOR token returns HTTP 403 Forbidden.

---

## 3. Session Management in Electron Desktop

1. **Session Cookie Isolation:**
   - NextAuth manages session persistence inside the Chromium renderer's cookie partition.
   - HttpOnly cookies prevent XSS theft.
2. **Auto-Refresh Mechanism:**
   - When an access token expires (15 minutes), the Next.js API client intercepts HTTP 401, issues a refresh request using the refresh token, updates the session cookie seamlessly, and retries the original request without user interruption.
3. **Explicit Logout:**
   - Clicking "تسجيل الخروج" (Logout) revokes the active refresh token on the server and purges the desktop session cache, immediately returning to the login screen.
4. **Desktop App Restart:**
   - The user session persists across app restarts if the refresh token remains valid (within 7 days). If expired, the app prompts for credentials gracefully.

---

## 4. Protection Against Unauthorized LAN Access

In a physical clinic, visitors or unauthorized devices may connect to the clinic Wi-Fi. The following defensive measures are enforced:

1. **Token Authentication Required for All Data Endpoints:** The central Express server exposes no data to unauthenticated requests. `/health` returns only service status without patient or financial data.
2. **Rate Limiting & Brute-Force Prevention:**
   - Failed login attempts are throttled using IP and username buckets (maximum 5 failed attempts per 5 minutes per IP).
   - Exceeding attempts results in temporary 15-minute lockouts.
3. **Audit Trail Logging:**
   - All logins, logouts, failed authentication attempts, and sensitive financial actions generate tamper-evident records in the MongoDB `AuditLog` collection, logging the actor's user ID, IP address, action, and timestamp.

