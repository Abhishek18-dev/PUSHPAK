# 🛠️ Standalone 1-Click Game-Style Installer Guide (Zero Prerequisites)

This guide provides the complete, step-by-step instructions to bundle **PUSHPAK** into a single, self-contained Windows Installer (`.exe`). 

Like modern game installers, **end users will not need to install Java, Python, Node.js, Maven, or Git**. They simply run `Setup.exe`, click **Next**, and the app runs out-of-the-box.

---

## 📋 Architecture Overview

The standalone installer packages 4 essential layers into a single setup executable:

```
[ Single Setup-PUSHPAK-v1.0.0.exe (~250MB - 350MB compressed) ]
       │
       ├──► 1. Electron GUI Shell (Desktop Radar & Tactical Workstation)
       ├──► 2. Pre-compiled Spring Boot JAR (Backend REST & WebSocket Engine)
       ├──► 3. Embedded OpenJDK 17 JRE (Runs Java without system JAVA_HOME)
       ├──► 4. Embedded Python 3.11 + Wheels (Runs Bandit & Periodicity APIs)
       └──► 5. AI-ML Models & Checkpoints
```

---

## 🔗 Download Links for Required Portable Components

Download these official portable distributions (no installation needed on your machine, just download the ZIPs):

| Component | Version | Official Download URL |
| :--- | :--- | :--- |
| **OpenJDK 17 JRE (Portable)** | 17.0.10+ (Win x64) | [Adoptium Temurin 17 JRE .zip](https://github.com/adoptium/temurin17-binaries/releases/download/jdk-17.0.10%2B7/OpenJDK17U-jre_x64_windows_hotspot_17.0.10_7.zip) |
| **Python Embeddable** | 3.11.8 (Win x64) | [python-3.11.8-embed-amd64.zip](https://www.python.org/ftp/python/3.11.8/python-3.11.8-embed-amd64.zip) |
| **PIP Bootstrapper** | get-pip.py | [https://bootstrap.pypa.io/get-pip.py](https://bootstrap.pypa.io/get-pip.py) |
| **Inno Setup (Optional UI Builder)** | 6.2.2+ | [Inno Setup Official Download](https://jrsoftware.org/isdl.php) |

---

## 📁 Required Directory Layout for Packaging

In the `desktop/` directory, create a `runtimes/` folder structured as follows:

```
smart-rf-scheduler-scaffold/
├── desktop/
│   ├── runtimes/
│   │   ├── jre/                  <-- Extracted Adoptium JRE (contains bin/java.exe)
│   │   │   ├── bin/
│   │   │   │   ├── java.exe
│   │   │   │   └── ...
│   │   │   └── lib/
│   │   │
│   │   └── python/               <-- Extracted Python Embeddable + pip dependencies
│   │       ├── python.exe
│   │       ├── python311.zip
│   │       ├── Lib/site-packages/ (uvicorn, fastapi, torch, numpy, etc.)
│   │       └── ...
│   │
│   ├── main.js
│   ├── package.json
│   └── dist/                     <-- Built Electron React UI
```

---

## 🚀 Step-by-Step Implementation Walkthrough

### Step 1: Build the Java Spring Boot Backend JAR

Open PowerShell in the workspace root:

```powershell
cd Backend
mvn clean package -DskipTests
cd ..
```
*Verify output*: Ensure `Backend/target/backend-0.0.1-SNAPSHOT.jar` exists.

---

### Step 2: Prepare the Portable JRE

1. Download [Adoptium Temurin 17 JRE .zip](https://github.com/adoptium/temurin17-binaries/releases/download/jdk-17.0.10%2B7/OpenJDK17U-jre_x64_windows_hotspot_17.0.10_7.zip).
2. Extract the archive into:
   `desktop/runtimes/jre/`
3. Verify that `desktop/runtimes/jre/bin/java.exe` exists by testing:
   ```powershell
   .\desktop\runtimes\jre\bin\java.exe -version
   ```
   *(It should display `openjdk version "17.0.10"`).*

---

### Step 3: Prepare the Embedded Python Environment

1. Download [python-3.11.8-embed-amd64.zip](https://www.python.org/ftp/python/3.11.8/python-3.11.8-embed-amd64.zip).
2. Extract the archive into `desktop/runtimes/python/`.
3. **Enable `import site`** in Python embedded:
   - Open `desktop/runtimes/python/python311._pth` in any text editor.
   - Uncomment the last line by changing `#import site` $\rightarrow$ `import site`.
4. **Install pip** inside the embedded Python:
   ```powershell
   curl.exe -o desktop\runtimes\python\get-pip.py https://bootstrap.pypa.io/get-pip.py
   .\desktop\runtimes\python\python.exe desktop\runtimes\python\get-pip.py
   ```
5. **Install the AI-ML dependencies** directly into the embedded runtime:
   ```powershell
   .\desktop\runtimes\python\python.exe -m pip install fastapi uvicorn pydantic numpy scipy torch
   ```
6. Verify the embedded python:
   ```powershell
   .\desktop\runtimes\python\python.exe -c "import torch, fastapi, uvicorn; print('Embedded Python Ready!')"
   ```

---

### Step 4: Build the Desktop Frontend UI

Compile the React / Vite desktop interface:

```powershell
cd desktop
npm install
npm run build
cd ..
```
*Verify output*: Ensure `desktop/dist/index.html` exists.

---

### Step 5: Configure `electron-builder` to Bundle Everything

In [desktop/package.json](file:///c:/Users/arast/Downloads/smart-rf-scheduler-scaffold/desktop/package.json), configure `extraResources` so electron-builder bundles the runtimes, backend jar, and AI-ML Python code:

```json
  "build": {
    "appId": "com.drdo.rfscan.desktop",
    "productName": "Intelligent RF Spectrum Scanner",
    "directories": {
      "output": "../deployment/installer"
    },
    "files": [
      "dist/**/*",
      "main.js",
      "package.json"
    ],
    "extraResources": [
      {
        "from": "runtimes",
        "to": "runtimes",
        "filter": ["**/*"]
      },
      {
        "from": "../Backend/target/backend-0.0.1-SNAPSHOT.jar",
        "to": "backend/backend-0.0.1-SNAPSHOT.jar"
      },
      {
        "from": "../ai-ml",
        "to": "ai-ml",
        "filter": ["**/*", "!**/__pycache__/**", "!**/.pytest_cache/**"]
      }
    ],
    "win": {
      "target": ["nsis"]
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true,
      "createStartMenuShortcut": true,
      "shortcutName": "PUSHPAK RF Spectrum Scanner"
    }
  }
```

---

### Step 6: Generate the Single `.exe` Installer

Run the distribution build:

```powershell
cd desktop
npm run dist
```

**Output**:
Look in `deployment/installer/`:
```
deployment/installer/Intelligent RF Spectrum Scanner Setup 1.0.0.exe
```

---

## 🎮 The End-User Experience

When you give this `.exe` to someone else:
1. They download `Intelligent RF Spectrum Scanner Setup 1.0.0.exe`.
2. They double-click the file.
3. Windows Setup opens with:
   - License Agreement / Terms
   - Destination folder selector (`C:\Program Files\Intelligent RF Spectrum Scanner`)
   - Desktop and Start Menu shortcut toggles
4. They click **Install** (takes ~15–30 seconds to unpack).
5. They click **Finish** (with *Launch App* checked).
6. **Everything starts automatically**:
   - The embedded JRE boots Spring Boot on port 8080.
   - The embedded Python boots the Bandit & Periodicity microservices on 8500 & 8600.
   - The tactical dark radar UI appears on screen.
   - **Zero configuration, zero command line, zero dependencies required.**

---

## 📦 Alternative: Inno Setup Master Installer

If you prefer the classic game setup wizard with custom banner graphics and sound:
Use the provided Inno Setup script at `deployment/installer/setup.iss` and compile using Inno Setup Compiler (`ISCC.exe setup.iss`).
