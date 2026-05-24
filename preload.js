const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('electronAPI', {
  onTimeUpdate: (cb) => ipcRenderer.on('time-update', (_, t) => cb(t)),
  onTimerState: (cb) => ipcRenderer.on('timer-state', (_, s) => cb(s)),
  onSessionComplete: (cb) => ipcRenderer.on('session-complete', (_, s) => cb(s)),
  onStatsUpdate: (cb) => ipcRenderer.on('stats-update', (_, s) => cb(s)),
  onPlaySoundStart: (cb) => ipcRenderer.on('play-sound-start', () => cb()),
  onStopSound: (cb) => ipcRenderer.on('stop-sound', () => cb()),
  toggleTimer: () => ipcRenderer.send('toggle-timer'),
  resetTimer: () => ipcRenderer.send('reset-timer'),
  stopSound: () => ipcRenderer.send('stop-sound'),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  getStats: () => ipcRenderer.invoke('get-stats'),
  resetStats: () => ipcRenderer.invoke('reset-stats')
});