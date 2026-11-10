# Phase 1: Codebase Discovery and Technical Audit

**Project:** Clinic Management System Desktop Migration  
**Source Repository:** `https://github.com/Raheeemsala7/clinic-management-system-server`  
**Target:** Multi-Computer Windows Desktop Application (Reception Central Server + Doctor Client over LAN)  
**Date of Audit:** November 2026  
**Auditor:** Senior Software Architect & Full-Stack Systems Engineer  

---

## 1. Executive Summary

A comprehensive architectural and source-level audit was conducted on the Clinic Management System repository. The codebase represents a single-doctor, multi-role clinical operating platform engineered with modern web technologies:

- **Backend:** Node.js, Express.js 5.3.0, TypeScript 5.3.3, Mongoose 9.11.2, MongoDB, Argon2, JWT.
- **Active Modern Frontend (`next/`):** Next.js 16.4.3 (App Router with Parallel Routes: `@admin`, `@doctor`, `@receptionist`), React 19.3.0, NextAuth 4.24.15, `@tanstack/react-query` 5.105.1, `next-intl` 4.14.9, Tailwind CSS v4, Lucide React, Zod.
- **Legacy Frontend Prototype (`client/`):** An earlier Next.js 16.3.0 prototype that preceded the parallel-route rewrite; preserved in Git for historical reference but superseded by `next/`.
- **Database:** MongoDB Community Edition (previously configured with cloud fallback; fully compatible with local instance).
- **Storage:** Dual driver in code (Tigris S3 `@aws-sdk/client-s3` and local disk fallback via `LOCAL_STORAGE_PATH`).
- **Real-Time:** Tokenized Socket.IO ticket architecture (`POST /api/v1/auth/socket-ticket`), with client-side polling fallback in place.

The application possesses exceptionally high architectural modularity, clear role segregation (Admin, Doctor, Reception), strong Arabic RTL typography (Cairo font), and specialized ENT clinical examination modules.

---

## 2. Directory Structure & Codebase Layout

```
dr-eslam/
├── next/                     # ACTIVE MODERN FRONTEND (Next.js 16.4.3 + React 19)
│   ├── src/
│   │   ├── app/              # App Router Root
│   │   │   ├── api/          # Route Handlers (Proxying to Express backend)
│   │   │   │   ├── attachments/upload/route.ts
│   │   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   │   ├── closing/preview/route.ts
│   │   │   │   ├── doctor-status/route.ts
│   │   │   │   ├── doctors/[doctorId]/slots/route.ts
│   │   │   │   ├── expenses/budget/route.ts
│   │   │   │   ├── patients/search/route.ts
│   │   │   │   ├── payments/route.ts
│   │   │   │   └── queue/today/route.ts
│   │   │   ├── auth/login/   # Login UI
│   │   │   ├── dashboard/    # Role-Based Dashboard using Parallel Routes
│   │   │   │   ├── @admin/   # Admin dashboard, closing, expenses, reports
│   │   │   │   ├── @doctor/  # Doctor dashboard, calendar, examination, ENT sheet
│   │   │   │   ├── @receptionist/ # Queue, appointments, patients, checkout
│   │   │   │   ├── layout.tsx
│   │   │   │   └── default.tsx
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx      # Public landing & online booking page
│   │   │   └── globals.css
│   │   ├── features/         # Domain-Driven Feature Modules
│   │   │   ├── appointments/ # Booking, queue, slots, calendar
│   │   │   ├── auth/         # Login form, credentials action
│   │   │   ├── closing/      # Financial daily closing
│   │   │   ├── dashboard/    # Navigation, sidebar, headers
│   │   │   ├── examination/  # ENT clinical diagrams, canvas drawings, paper sheet
│   │   │   ├── expenses/     # Petty cash expenses, budget tracking
│   │   │   ├── home/         # Clinic landing page components
│   │   │   ├── patient/      # 4-part name patient registration & search
│   │   │   └── payments/     # Cash/Card/Wallet billing & receipts
│   │   ├── i18n/             # next-intl bilingual setup (ar, en)
│   │   ├── shared/           # Core UI components, layout shell, providers, hooks
│   │   └── auth.ts           # NextAuth configuration
│   ├── next.config.ts        # Next.js configuration & API rewrites
│   └── package.json
│
├── server/                   # CENTRAL EXPRESS BACKEND (Node.js + Express 5 + Mongoose)
│   ├── src/
│   │   ├── config/           # env.ts, swagger.ts
│   │   ├── controllers/      # Express controllers (auth, patients, queue, visits, etc.)
│   │   ├── db/               # connection.ts (Mongoose connection pool)
│   │   ├── middleware/       # auth.ts (JWT RBAC), errorHandler.ts, asyncHandler.ts
│   │   ├── models/           # Mongoose schemas (13 models, UUID _id)
│   │   ├── routes/           # REST endpoints (/api/v1/...)
│   │   ├── scripts/          # seed.ts (Users, Settings, Drugs), test-integration.ts
│   │   ├── services/         # Business logic layer
│   │   │   ├── appointments.service.ts
│   │   │   ├── attachments.service.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── closing.service.ts
│   │   │   ├── doctor-schedule.service.ts
│   │   │   ├── drugs.service.ts
│   │   │   ├── expenses.service.ts
│   │   │   ├── patients.service.ts
│   │   │   ├── payments.service.ts
│   │   │   ├── prescriptions.service.ts
│   │   │   ├── queue.service.ts
│   │   │   ├── reports.service.ts
│   │   │   ├── settings.service.ts
│   │   │   ├── storage.service.ts
│   │   │   ├── users.service.ts
│   │   │   └── visits.service.ts
│   │   ├── utils/            # arabic.ts, clinic-date.ts, crypto.ts, errors.ts, response.ts
│   │   ├── app.ts            # Express application setup
│   │   └── server.ts         # Server entrypoint (listening on 0.0.0.0:4000)
│   └── package.json
│
├── client/                   # LEGACY FRONTEND ITERATION (Next.js 16.3.0, preserved)
└── specs/                    # Project specifications and architecture documents
```

---

## 3. Technology Stack & Dependencies Audit

| Component | Current Technology | Version | Migration Compatibility Assessment |
|---|---|---|---|
| **Runtime** | Node.js (Windows x64) | 20.19.3 | Fully compatible with Electron v30+ embedded Node runtime. |
| **Package Manager** | pnpm | 12.15.0 | High performance; supports workspace monorepo. |
| **Backend Framework** | Express.js | 5.3.0 | Compatible. Runs seamlessly as Node child process or service. |
| **ORM / ODM** | Mongoose | 9.11.2 | Compatible. Connects to local MongoDB Community Edition at `localhost:27017`. |
| **Database** | MongoDB Community | 8.x / 7.x | Installed & active on Windows. Zero cloud dependencies. |
| **Security / Auth** | Argon2 + jsonwebtoken | 0.31.2 / 9.0.3 | Compatible. Strict cryptographic validation. |
| **File Detection** | `file-type` | 16.5.4 | Compatible. Enforces magic-byte file signature validation. |
| **Frontend Framework** | Next.js (App Router) | 16.4.3 | Compatible. Requires running Node instance (Server Actions + NextAuth). |
| **UI Library** | React / React DOM | 19.3.0 | Compatible with modern Chromium renderer in Electron. |
| **Styling** | Tailwind CSS | 4.x | Fast build, CSS variables tokens. |
| **State / Cache** | `@tanstack/react-query` | 5.105.1 | Ideal for real-time cache invalidation on Socket events. |
| **Localization** | `next-intl` | 4.14.9 | Full Arabic RTL + English LTR support preserved. |
| **Storage Driver** | Tigris S3 + Local disk | - | S3 must be fully replaced with local disk storage for LAN multi-computer desktop. |

---

## 4. Backend Architecture & API Audit

### 4.1 Database Connection (`server/src/db/connection.ts`)
- Mongoose connection manages cached singletons.
- Defaults to `mongodb://localhost:27017/clinic-management` when `MONGODB_URI` is not provided.
- Binds to MongoDB instance seamlessly.

### 4.2 Mongoose Data Models (`server/src/models/`)
All models standardize on UUID `_id` strings (generated via `uuidv4`) and employ a uniform `transformOptions` base converting `_id` to `id` and stripping `__v`.

1. **`User`**: `id`, `name`, `username`, `passwordHash` (Argon2), `role` (`ADMIN` | `DOCTOR` | `RECEPTION`), `isActive`, timestamps.
2. **`Patient`**: `id`, `fullName`, `searchName` (normalized Arabic), `phone`, `gender`, `age`, `dateOfBirth`, `address`, `allergies`, `chronicConditions`, `generalNotes`, `createdById`.
3. **`Appointment`**: `id`, `patientId`, `doctorId`, `clinicDate` (`YYYY-MM-DD`), `source` (`SCHEDULED` | `WALK_IN`), `type` (`EXAMINATION`, `FOLLOW_UP`, `POST_OPERATIVE`, `LAB_TESTS_IMAGING`, `TEST_RESULTS_REVIEW`, `CONSULTATION`), `status` (`BOOKED`, `WAITING`, `IN_PROGRESS`, `PENDING_CHECKOUT`, `COMPLETED`, `CANCELLED`, `NO_SHOW`), `queueNumber`, `queueOrder`, `postponedCount`, `totalAmount`, `paidAmount`, `remainingAmount`, `paymentStatus`, `isExempt`, `attachments` (array of `IAttachmentMeta`).
4. **`Visit`**: `id`, `appointmentId`, `patientId`, `doctorId`, `complaint`, `diagnosis`, `notes`, `instructions`, `followUpDate`, `entExamination` (Mixed document containing ENT canvas drawings and schema data), `status` (`OPEN` | `CLOSED`), `version` (optimistic concurrency lock).
5. **`Prescription` & `PrescriptionTemplate`**: Versioned prescription records with drug items (`drugName`, `dose`, `frequency`, `duration`, `instructions`, `sortOrder`).
6. **`Payment`**: Financial records tracking `amount`, `method` (`CASH` | `CARD` | `WALLET`), `kind`, `status` (`RECORDED` | `VOIDED`), `receivedById`.
7. **`Expense`**: Petty cash expense ledger with categories, receipts, and approval workflow.
8. **`DoctorStatus`**: `_id` (doctorId), `status` (`AVAILABLE` | `WITH_PATIENT` | `BREAK`).
9. **`DoctorSchedule`**: Weekly recurring slots and overrides.
10. **`DailyClosing`**: Financial reconciliation at end of clinic shift.
11. **`AuditLog`**: Tamper-evident logging of user actions and sensitive operations.
12. **`Setting`**: Key/value store for clinic name, doctor title, fees, currency (`EGP`), working hours.
13. **`RefreshToken`**: Refresh token family with SHA-256 hashing and reuse detection.

### 4.3 REST API Endpoints

| Prefix | Core Functionality | Permitted Roles |
|---|---|---|
| `/api/v1/auth` | Login, refresh token, logout, me, socket-ticket | Public (login), Authenticated |
| `/api/v1/users` | User management & doctors list | Admin (`/users`), All (`/users/doctors`) |
| `/api/v1/patients` | Patient CRUD, 4-part name check, Arabic search | Reception, Doctor, Admin |
| `/api/v1/appointments`| Booking creation, status transitions, postponement | Reception, Doctor, Admin |
| `/api/v1/queue` | Today's queue board, calling next patient | Reception, Doctor, Admin |
| `/api/v1/visits` | Clinical examination, ENT records, optimistic lock | Doctor only (Read: Admin/Doctor) |
| `/api/v1/prescriptions`| Prescription issuance, templates, printing | Doctor only |
| `/api/v1/payments` | Payment receipts, remaining balance settlement | Reception, Admin |
| `/api/v1/expenses` | Expense recording, category budgets, approvals | Reception (create), Admin (approve) |
| `/api/v1/closing` | Shift closing calculations, printout reconciliation | Reception (create), Admin (view/reopen)|
| `/api/v1/reports` | Daily income, monthly trends, expense summaries | Admin only |
| `/api/v1/settings` | Clinic profile, fees, currency settings | Admin only (Read: All) |
| `/api/v1/audit-logs`| Security audit trail inspection | Admin only |
| `/api/v1/attachments`| File upload, presigned URLs, streaming download | Authenticated clinic staff |

---

## 5. Frontend Architecture & Flow Audit (`next/`)

### 5.1 Routing & Layout Strategy
- Uses Next.js App Router with Parallel Routes:
  - `app/dashboard/@admin`: Dedicated administration views.
  - `app/dashboard/@doctor`: Clinical workbench, today's queue, examination screen with interactive ENT anatomical canvas.
  - `app/dashboard/@receptionist`: Patient booking, waiting list, payment desk, daily register.
- Landing page (`app/page.tsx`): Allows public patient self-booking via WhatsApp or web form.

### 5.2 Client-to-Server Communication Patterns
- **Server Components & Server Actions**: Use `getNextAuthToken()` from session cookies and make server-side HTTP calls to `process.env.API_URL` (defaulting to `http://localhost:4000/api/v1`).
- **Route Handlers (`app/api/*`)**: Proxy client-side calls (e.g. searching patients, queue polling, uploads) to Express with Bearer tokens.
- **Client Components (`"use client"`)**: Rely on `@tanstack/react-query` to execute client mutations and queries with automatic background caching.

---

## 6. Identification of Cloud Dependencies & Migration Challenges

### 6.1 S3 / Tigris Storage Dependency (Critical)
- **Current Issue:** `server/src/services/storage.service.ts` and `next/src/shared/lib/utils/upload.client.ts` contain references to Tigris Data S3 (`https://t3.storage.dev`). If offline or without internet credentials, direct client upload to S3 fails.
- **Migration Remedy:** Transition completely to local file storage on the Reception computer (`D:/ClinicData/uploads/`). Centralize upload through an authenticated Express endpoint using `multer` with disk storage and magic-byte security checks. The Doctor PC uploads directly to this endpoint over LAN.

### 6.2 Socket.IO Implementation Status
- **Current Issue:** The backend exposes `/api/v1/auth/socket-ticket`, but `socket.io` server is not currently initialized in `server.ts`. Frontend relies on a 5-second polling fallback.
- **Migration Remedy:** Attach `socket.io` directly to the Express HTTP server on Reception. Enable event-driven synchronization across LAN for immediate queue, appointment, and examination updates.

### 6.3 Hardcoded URLs & Network Binding
- **Current Issue:** `API_URL` in `next/.env.example` is hardcoded to `http://localhost:4000/api/v1`. On the Doctor PC, this must point to the Reception PC's LAN IP (e.g., `http://192.168.1.50:4000/api/v1`).
- **Migration Remedy:** Introduce an Electron network configuration screen on initial launch (or settings modal) allowing the Doctor PC to configure or auto-discover the Reception Server's LAN IP address.

### 6.4 Next.js Desktop Execution Mode
- **Current Issue:** Next.js uses App Router, Server Actions, dynamic routes, and NextAuth. It cannot be converted into a static HTML export (`output: 'export'`).
- **Migration Remedy:** Run Next.js as a production Node.js standalone server alongside Express, wrapped and orchestrated inside the Electron Main process.

---

## 7. Features That Must Be Preserved 100%

1. **Role-Based Isolation:** Doctors must not access financial closing or accounts; Reception must not view sensitive medical visit notes or clinical ENT examinations.
2. **Arabic Localization & RTL:** High-quality Cairo font rendering, right-to-left layout transitions, and Western digits formatting.
3. **Four-Part Patient Name Enforcement:** Mandatory four-component validation across frontend and backend.
4. **Color-Coded Appointment Types:** Distinct color badges for the 5 appointment categories across calendar, queue, and tables.
5. **ENT Clinical Examination Module:** Interactive drawing canvas overlay and SVG anatomical diagrams must remain fully functional and responsive inside Electron.
6. **Optimistic Concurrency Locking:** Preserving the `version` counter on visits to prevent race conditions during patient record edits.
7. **Audit Trail:** Preserving tamper-evident audit logging for financial and medical record actions.

---

## 8. Conclusion of Audit

The existing system possesses solid fundamentals and clean separation of concerns. By replacing the cloud storage service with local storage on the Reception PC, initializing real Socket.IO communication, and packaging both the backend and frontend into an Electron desktop container with configurable LAN networking, the application will fulfill all requirements of a reliable, offline-capable multi-computer clinic desktop solution.

