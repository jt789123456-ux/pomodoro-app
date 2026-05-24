const { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain } = require('electron');
const path = require('path');

let mainWindow;
let tray;
let timer = null;
let remainingTime = 25 * 60;
let isRunning = false;
let isWorkSession = true;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 300,
    height: 400,
    resizable: false,
    maximizable: false,
    minimizable: true,
    closable: true,
    alwaysOnTop: true,
    webPreferences: { preload: path.join(__dirname, 'preload.js') }
  });
  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  mainWindow.setMenu(null);
}

function createTray() {
  const icon = nativeImage.createEmpty();
  tray = new Tray(icon);
  tray.setToolTip('番茄钟');
  updateTrayMenu();
}

function updateTrayMenu() {
  const contextMenu = Menu.buildFromTemplate([
    { label: isRunning ? '暂停' : '继续', click: () => toggleTimer() },
    { label: '重置', click: () => resetTimer() },
    { type: 'separator' },
    { label: '退出', click: () => app.quit() }
  ]);
  tray.setContextMenu(contextMenu);
}

function toggleTimer() {
  if (isRunning) {
    clearInterval(timer);
    isRunning = false;
  } else {
    isRunning = true;
    timer = setInterval(() => {
      remainingTime--;
      mainWindow.webContents.send('time-update', remainingTime);
      if (remainingTime <= 0) {
        clearInterval(timer);
        isRunning = false;
        onSessionComplete();
      }
    }, 1000);
  }
  updateTrayMenu();
  mainWindow.webContents.send('timer-state', { isRunning, isWorkSession });
}

function resetTimer() {
  clearInterval(timer);
  isRunning = false;
  isWorkSession = true;
  remainingTime = 25 * 60;
  updateTrayMenu();
  mainWindow.webContents.send('time-update', remainingTime);
  mainWindow.webContents.send('timer-state', { isRunning, isWorkSession });
}

function onSessionComplete() {
  isWorkSession = !isWorkSession;
  remainingTime = isWorkSession ? 25 * 60 : 5 * 60;
  mainWindow.webContents.send('session-complete', { isWorkSession });
  mainWindow.webContents.send('time-update', remainingTime);
  updateTrayMenu();
}

ipcMain.on('toggle-timer', toggleTimer);
ipcMain.on('reset-timer', resetTimer);

app.whenReady().then(() => {
  createWindow();
  createTray();
});

app.on('window-close', (event) => {
  event.preventDefault();
  mainWindow.hide();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});