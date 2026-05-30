const { app, BrowserWindow } = require('electron');
const path = require('path');

// Set NEC exe path before requiring necserver so it picks it up
// In packaged app: process.resourcesPath points to the resources/ folder outside asar
// In dev: fall back to __dirname
const necBase = app.isPackaged ? process.resourcesPath : __dirname;
const necBinary = process.platform === 'win32' ? 'nec2dxs500.exe' : 'nec2c';
process.env.NEC_EXE_PATH = path.join(necBase, 'NEC', necBinary);

// Start NEC HTTP server directly in the main process (port 7373)
require('./necserver.js');

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    },
    title: 'PolarScope',
    backgroundColor: '#0f172a',
    show: false
  });

  win.loadFile('polarscopemain.html');
  win.setMenuBarVisibility(false);

  // Show once ready so there's no white flash
  win.once('ready-to-show', () => win.show());
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => app.quit());
