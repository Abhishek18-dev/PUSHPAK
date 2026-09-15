const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn, execSync } = require('child_process');

let mainWindow = null;
const childProcesses = []; // Track all spawned backend services

// ---------------------------------------------------------------------------
// Dynamically locate the workspace root by walking up directories
// until we find both 'ai-ml' and 'Backend' directories.
// ---------------------------------------------------------------------------
function getProjectRoot() {
  let candidates = [];
  try {
    candidates.push(path.dirname(app.getPath('exe')));
  } catch (_) {}
  candidates.push(__dirname);
  candidates.push(process.cwd());

  for (const startPath of candidates) {
    let cur = startPath;
    for (let i = 0; i < 6; i++) {
      if (fs.existsSync(path.join(cur, 'ai-ml')) && fs.existsSync(path.join(cur, 'Backend'))) {
        return cur;
      }
      const parent = path.dirname(cur);
      if (parent === cur) break;
      cur = parent;
    }
  }

  // Fallback to default relative path
  return path.resolve(__dirname, '..');
}

// ---------------------------------------------------------------------------
// Locate Java and Python executables
// ---------------------------------------------------------------------------
function findJava(projectRoot) {
  // 1. Check bundled portable JRE inside app resources or project directory
  const bundledCandidates = [
    path.join(process.resourcesPath || '', 'runtimes', 'jre', 'bin', 'java.exe'),
    path.join(__dirname, 'runtimes', 'jre', 'bin', 'java.exe'),
    path.join(projectRoot, 'runtimes', 'jre', 'bin', 'java.exe'),
  ];
  for (const cand of bundledCandidates) {
    if (cand && fs.existsSync(cand)) return cand;
  }

  // 2. Check JAVA_HOME environment variable
  if (process.env.JAVA_HOME && fs.existsSync(path.join(process.env.JAVA_HOME, 'bin', 'java.exe'))) {
    return path.join(process.env.JAVA_HOME, 'bin', 'java.exe');
  }

  // 3. System PATH
  try {
    const javaPath = execSync('where.exe java', { encoding: 'utf8' }).trim().split('\n')[0].trim();
    if (javaPath && fs.existsSync(javaPath)) return javaPath;
  } catch (_) {}

  return null;
}

function findPython(projectRoot) {
  // 1. Check bundled portable Python runtime
  const bundledCandidates = [
    path.join(process.resourcesPath || '', 'runtimes', 'python', 'python.exe'),
    path.join(__dirname, 'runtimes', 'python', 'python.exe'),
    path.join(projectRoot, 'runtimes', 'python', 'python.exe'),
    path.join(projectRoot, 'venv', 'Scripts', 'python.exe'),
  ];
  for (const cand of bundledCandidates) {
    if (cand && fs.existsSync(cand)) return cand;
  }

  // 2. System PATH
  try {
    const pythonPath = execSync('where.exe python', { encoding: 'utf8' }).trim().split('\n')[0].trim();
    if (pythonPath && fs.existsSync(pythonPath)) return pythonPath;
  } catch (_) {}

  return null;
}

// ---------------------------------------------------------------------------
// Port check helpers
// ---------------------------------------------------------------------------
function isPortInUse(port) {
  const net = require('net');
  return new Promise((resolve) => {
    const sock = new net.Socket();
    sock.setTimeout(400);
    sock.once('connect', () => { sock.destroy(); resolve(true); });
    sock.once('error', () => { sock.destroy(); resolve(false); });
    sock.once('timeout', () => { sock.destroy(); resolve(false); });
    sock.connect(port, '127.0.0.1');
  });
}

function waitForPort(port, timeoutMs = 45000) {
  const net = require('net');
  const start = Date.now();
  return new Promise((resolve) => {
    function tryConnect() {
      if (Date.now() - start > timeoutMs) {
        return resolve(false);
      }
      const sock = new net.Socket();
      sock.setTimeout(500);
      sock.once('connect', () => { sock.destroy(); resolve(true); });
      sock.once('error', () => { sock.destroy(); setTimeout(tryConnect, 600); });
      sock.once('timeout', () => { sock.destroy(); setTimeout(tryConnect, 600); });
      sock.connect(port, '127.0.0.1');
    }
    tryConnect();
  });
}

// ---------------------------------------------------------------------------
// Launch all background services
// ---------------------------------------------------------------------------
async function launchServices() {
  const projectRoot = getProjectRoot();
  const javaExe = findJava(projectRoot);
  const pythonExe = findPython(projectRoot);

  // 1. AI-ML-1 (Bandit & DQN scheduler) on port 8500
  if (pythonExe) {
    const ml1Dir = [
      path.join(process.resourcesPath || '', 'ai-ml', 'ai-ml-1-scheduler'),
      path.join(projectRoot, 'ai-ml', 'ai-ml-1-scheduler'),
    ].find(p => p && fs.existsSync(p));

    if (ml1Dir) {
      const ml1Running = await isPortInUse(8500);
      if (!ml1Running) {
        const ml1 = spawn(pythonExe, ['-m', 'uvicorn', 'ml.api.main:app', '--host', '127.0.0.1', '--port', '8500'], {
          cwd: ml1Dir,
          stdio: 'ignore',
          windowsHide: true,
        });
        childProcesses.push(ml1);
      }
    }
  }

  // 2. AI-ML-2 (Periodicity Estimator) on port 8600
  if (pythonExe) {
    const ml2Dir = [
      path.join(process.resourcesPath || '', 'ai-ml', 'ai-ml-2-periodicity'),
      path.join(projectRoot, 'ai-ml', 'ai-ml-2-periodicity'),
    ].find(p => p && fs.existsSync(p));

    if (ml2Dir) {
      const ml2Running = await isPortInUse(8600);
      if (!ml2Running) {
        const ml2 = spawn(pythonExe, ['-m', 'uvicorn', 'periodicity.api.main:app', '--host', '127.0.0.1', '--port', '8600'], {
          cwd: ml2Dir,
          stdio: 'ignore',
          windowsHide: true,
        });
        childProcesses.push(ml2);
      }
    }
  }

  // 3. Java Spring Boot Backend on port 8080
  if (javaExe) {
    const jarCandidates = [
      path.join(process.resourcesPath || '', 'backend', 'backend-0.0.1-SNAPSHOT.jar'),
      path.join(__dirname, 'backend', 'backend-0.0.1-SNAPSHOT.jar'),
      path.join(projectRoot, 'Backend', 'target', 'backend-0.0.1-SNAPSHOT.jar'),
    ];
    const jarPath = jarCandidates.find(p => p && fs.existsSync(p));

    if (jarPath) {
      const backendRunning = await isPortInUse(8080);
      if (!backendRunning) {
        const backend = spawn(javaExe, ['-jar', jarPath], {
          cwd: path.dirname(jarPath),
          stdio: 'ignore',
          windowsHide: true,
        });
        childProcesses.push(backend);
      }
    }
  }

  // Wait until backend port is available
  await waitForPort(8080, 45000);
}

// ---------------------------------------------------------------------------
// Clean up all child processes on quit
// ---------------------------------------------------------------------------
function killAllServices() {
  for (const proc of childProcesses) {
    try {
      if (proc && !proc.killed) {
        try {
          execSync(`taskkill /pid ${proc.pid} /T /F`, { stdio: 'ignore' });
        } catch (_) {
          proc.kill('SIGTERM');
        }
      }
    } catch (_) {}
  }
  childProcesses.length = 0;
}

// ---------------------------------------------------------------------------
// Create main application window
// ---------------------------------------------------------------------------
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1100,
    minHeight: 720,
    title: 'Intelligent RF Spectrum Scan Strategy — Tactical Workstation',
    backgroundColor: '#020503',
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  const distPath = path.join(__dirname, 'dist', 'index.html');

  if (fs.existsSync(distPath) && !process.env.ELECTRON_DEV) {
    mainWindow.loadFile(distPath);
  } else {
    mainWindow.loadURL('http://localhost:3000').catch(() => {
      if (fs.existsSync(distPath)) {
        mainWindow.loadFile(distPath);
      }
    });
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ---------------------------------------------------------------------------
// App Lifecycle
// ---------------------------------------------------------------------------
app.whenReady().then(() => {
  createWindow();
  launchServices();
});

app.on('window-all-closed', () => {
  killAllServices();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  killAllServices();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
