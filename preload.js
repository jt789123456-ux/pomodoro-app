const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('electronAPI', {
  onTimeUpdate: (cb) => ipcRenderer.on('time-update', (_, t) => cb(t)),
  onTimerState: (cb) => ipcRenderer.on('timer-state', (_, s) => cb(s)),
  onSessionComplete: (cb) => ipcRenderer.on('session-complete', (_, s) => cb(s)),
  toggleTimer: () => ipcRenderer.send('toggle-timer'),
  resetTimer: () => ipcRenderer.send('reset-timer')
});