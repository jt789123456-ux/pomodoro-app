const { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain, globalShortcut, Notification } = require('electron');
const path = require('path');
const Store = require('electron-store');

const store = new Store({
  defaults: {
    workDuration: 25,
    breakDuration: 5,
    darkTheme: true,
    stats: { date: '', workSessions: 0, breakSessions: 0 }
  }
});

let mainWindow;
let tray;
let timer = null;
let remainingTime = 25 * 60;
let isRunning = false;
let isWorkSession = true;
let soundInterval = null;

function getSettings() {
  return {
    workDuration: store.get('workDuration'),
    breakDuration: store.get('breakDuration'),
    darkTheme: store.get('darkTheme')
  };
}

function saveSettings(settings) {
  if (settings.workDuration) store.set('workDuration', settings.workDuration);
  if (settings.breakDuration) store.set('breakDuration', settings.breakDuration);
  if (settings.darkTheme !== undefined) store.set('darkTheme', settings.darkTheme);
}

function getStats() {
  const today = new Date().toDateString();
  const stats = store.get('stats');
  if (stats.date !== today) {
    store.set('stats', { date: today, workSessions: 0, breakSessions: 0 });
    return { workSessions: 0, breakSessions: 0 };
  }
  return stats;
}

function resetStats() {
  store.set('stats', { date: new Date().toDateString(), workSessions: 0, breakSessions: 0 });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 320,
    height: 480,
    minWidth: 280,
    minHeight: 400,
    resizable: true,
    maximizable: true,
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
  const settings = getSettings();
  remainingTime = settings.workDuration * 60;
  updateTrayMenu();
  mainWindow.webContents.send('time-update', remainingTime);
  mainWindow.webContents.send('timer-state', { isRunning, isWorkSession });
}

function onSessionComplete() {
  isWorkSession = !isWorkSession;
  const settings = getSettings();
  remainingTime = isWorkSession ? settings.workDuration * 60 : settings.breakDuration * 60;

  // Update stats
  const stats = getStats();
  if (isWorkSession) {
    stats.breakSessions++;
  } else {
    stats.workSessions++;
  }
  store.set('stats', stats);

  // Send notification
  if (Notification.isSupported()) {
    const notification = new Notification({
      title: '番茄钟',
      body: isWorkSession ? '休息结束，开始工作！' : '工作结束，休息一下吧！'
    });
    notification.show();
  }

  // Play sound repeatedly until user clicks
  mainWindow.webContents.send('play-sound-start');

  mainWindow.webContents.send('session-complete', { isWorkSession });
  mainWindow.webContents.send('time-update', remainingTime);
  mainWindow.webContents.send('stats-update', getStats());
  mainWindow.webContents.send('timer-state', { isRunning: false, isWorkSession });
  updateTrayMenu();
  mainWindow.show();

function registerShortcuts() {
  globalShortcut.register('Space', () => {
    if (mainWindow && mainWindow.isFocused()) {
      toggleTimer();
    }
  });
}

ipcMain.on('toggle-timer', () => {
  mainWindow.webContents.send('stop-sound');
  toggleTimer();
});
ipcMain.on('reset-timer', () => {
  mainWindow.webContents.send('stop-sound');
  resetTimer();
});
ipcMain.on('stop-sound', () => {
  mainWindow.webContents.send('stop-sound');
});
ipcMain.handle('get-settings', () => getSettings());
ipcMain.handle('save-settings', (_, settings) => saveSettings(settings));
ipcMain.handle('get-stats', () => getStats());
ipcMain.handle('reset-stats', () => resetStats());

app.whenReady().then(() => {
  createWindow();
  createTray();
  registerShortcuts();
});

app.on('window-close', (event) => {
  event.preventDefault();
  mainWindow.hide();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});