# Phase 2: Desktop Application & Installer Specification

**Document:** `specs/08-desktop-build.md`  
**Purpose:** Specify the Electron application structure, dual-mode launcher, standalone packaging, electron-builder configuration, and Windows NSIS installer creation.

---

## 1. Electron Application Architecture

The desktop application uses Electron to provide a native Windows experience while packaging the existing Next.js frontend and Express backend.

```
desktop/
├── src/
│   ├── main/
│   │   ├── index.ts               # Electron Main Process entry point
│   │   ├── window-manager.ts      # BrowserWindow lifecycle & settings
│   │   ├── process-supervisor.ts  # Spawns & monitors Express & Next.js child processes
│   │   ├── ipc-handlers.ts        # Handlers for backup, printing, network config
│   │   ├── network-discovery.ts   # UDP / mDNS server broadcast & scanner
│   │   └── menu-and-tray.ts       # Windows system tray and native menus
│   │
│   ├── preload/
│   │   └── index.ts               # Context-isolated secure bridge (window.electronAPI)
│   │
│   └── shared/
│       └── config-types.ts        # Typed configuration interfaces
│
├── resources/                     # App icons (.ico), splash screens, installer assets
│   ├── icon.ico
│   └── banner.bmp
│
├── package.json                   # Desktop runner dependencies & build scripts
├── tsconfig.json                  # TypeScript compiler settings for Main & Preload
└── electron-builder.yml           # Windows packaging & NSIS configuration
```

---

## 2. Dual-Mode Launcher Specification

When the user launches the application, the Main Process evaluates the machine's configuration:

```mermaid
flowchart TD
    Launch["Application Executable Launched"] --> CheckConfig{"Config Exists in %APPDATA%?"}
    
    CheckConfig -->|No (First Run)| Wizard["Display 'Clinic Setup Wizard'"]
    Wizard --> SelectMode["User Selects Mode:<br>1. Central Server (Reception PC)<br>2. Client Workstation (Doctor PC)"]
    
    SelectMode -->|Central Server| SetupServer["1. Set mode: 'server'<br>2. Verify local MongoDB running<br>3. Ensure D:/ClinicData directories exist<br>4. Save config.json"]
    SelectMode -->|Client Workstation| SetupClient["1. Set mode: 'client'<br>2. Prompt / Discover Reception Server IP<br>3. Test connection to http://SERVER_IP:4000/health<br>4. Save config.json"]

    CheckConfig -->|Yes| ReadConfig["Read config.json"]
    
    SetupServer --> BootMode
    SetupClient --> BootMode
    ReadConfig --> BootMode{"Mode == 'server'?"}
    
    BootMode -->|Yes (Server Mode)| RunServerFlow["1. Start Express API (Port 4000)<br>2. Start Next.js Server (Port 3000)<br>3. Load http://localhost:3000"]
    BootMode -->|No (Doctor Client)| RunClientFlow["1. Start Local Next.js Client (Port 3000) with API_URL=http://SERVER_IP:4000<br>2. Verify LAN Connection<br>3. Load http://localhost:3000"]
```

### 2.1 Server Mode (Reception Computer)
- **Processes Spawned:**
  1. Express API backend (`dist/src/server.js`) on port 4000.
  2. Next.js standalone server on port 3000.
- **Data Persistence:** Uses local MongoDB at `mongodb://127.0.0.1:27017/clinic-management` and local file storage at `D:/ClinicData/uploads/`.
- **Extra Capabilities:**
  - System Tray menu showing server status, local LAN IP address, and active client connections.
  - Backup & restore controls.

### 2.2 Client Mode (Doctor Computer)
- **Processes Spawned:**
  1. Local Next.js standalone client runner on port 3000 (configured to query the central Express API over LAN).
- **Zero Local Data:**
  - **Does NOT launch or require MongoDB.**
  - **Does NOT create local patient databases.**
- **Extra Capabilities:**
  - Persistent connection health badge to the Reception Server.
  - Settings dialog allowing reconnection if the server IP changes.

---

## 3. Packaging Next.js & Express into Electron

To achieve high runtime performance and zero lag:

1. **Next.js Standalone Build:**
   ```bash
   cd next && pnpm build
   ```
   Next.js produces `.next/standalone/`, bundling only the production dependencies needed to serve the App Router UI. Static assets (`next/public` and `.next/static`) are copied into `.next/standalone/.next/static`.
2. **Express API Build:**
   ```bash
   cd server && pnpm build
   ```
   Compiles TypeScript into pure JavaScript `dist/`.
3. **Electron Embedding:**
   - The compiled Express `dist/` and Next.js standalone folder are placed inside Electron's `app.asar.unpacked` directory so Node can execute them directly as child processes via `child_process.fork()`.
   - Node binary: Uses Electron's built-in Node.js runtime, eliminating the need to install Node.js separately on the target computers.

---

## 4. Electron Builder & NSIS Configuration (`electron-builder.yml`)

```yaml
appId: com.clinic.management.desktop
productName: Clinic Management System
copyright: Copyright © 2026 Dr. Eslam Clinic

directories:
  output: release
  buildResources: resources

files:
  - "dist/**/*"
  - "node_modules/**/*"
  - "package.json"

extraResources:
  - from: "../server/dist"
    to: "server"
    filter: ["**/*"]
  - from: "../next/.next/standalone"
    to: "frontend"
    filter: ["**/*"]
  - from: "../next/public"
    to: "frontend/public"
    filter: ["**/*"]
  - from: "../next/.next/static"
    to: "frontend/.next/static"
    filter: ["**/*"]

win:
  target:
    - target: nsis
      arch:
        - x64
  icon: resources/icon.ico

nsis:
  oneClick: false
  allowToChangeInstallationDirectory: true
  perMachine: true
  installerIcon: resources/icon.ico
  uninstallerIcon: resources/icon.ico
  installerHeaderIcon: resources/icon.ico
  createDesktopShortcut: always
  createStartMenuShortcut: true
  shortcutName: Clinic Management
  runAfterFinish: true
  deleteAppDataOnUninstall: false # CRITICAL: Preserves clinic configurations
```

> [!CAUTION]
> **Data Preservation Invariant:**
> The installer and uninstaller must **never** touch `D:/ClinicData/` (or `%APPDATA%/ClinicManagement/data/`). Upgrades replace only binary program files, preserving 100% of the patient database, uploads, and configuration history.

---

## 5. End-to-End Installation Procedures

### 5.1 Reception Computer (Central Server) Installation
1. Run `Clinic-Setup.exe` as Administrator.
2. Complete the installation wizard.
3. Launch the application.
4. On the setup screen, select **"Reception Computer (Central Server)"**.
5. The application confirms MongoDB status and initializes `D:/ClinicData/`.
6. The app displays the computer's LAN IP address (e.g. `192.168.1.50`).
7. Reception staff logs in with seed credentials and begins operation.

### 5.2 Doctor Computer (Client) Installation
1. Run `Clinic-Setup.exe`.
2. Launch the application.
3. On the setup screen, select **"Doctor Computer (Client Workstation)"**.
4. Enter the Reception Server's IP address (e.g. `192.168.1.50`).
5. Click **"Test Connection"** (verifies HTTP 200 from `/health`).
6. Click **"Connect & Finish"**.
7. Doctor logs in with doctor credentials and begins clinical workflow.

---

## 6. Auto-Start & Windows Service Integration

The Electron application can be toggled to launch automatically on Windows boot via Electron's `app.setLoginItemSettings({ openAtLogin: true })`, ensuring that the Reception Server is always up and ready when the clinic opens in the morning.

