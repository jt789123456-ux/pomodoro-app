const toggleBtn = document.getElementById('toggleBtn');
const resetBtn = document.getElementById('resetBtn');
const settingsBtn = document.getElementById('settingsBtn');
const themeBtn = document.getElementById('themeBtn');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');
const sessionLabelEl = document.getElementById('sessionLabel');
const timerEl = document.getElementById('timer');
const statsEl = document.getElementById('stats');
const settingsPanel = document.getElementById('settingsPanel');
const workDurationInput = document.getElementById('workDuration');
const breakDurationInput = document.getElementById('breakDuration');
const resetStatsBtn = document.getElementById('resetStatsBtn');

let isRunning = false;
let isWorkSession = true;
let darkTheme = true;

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function updateDisplay(time) {
  timerEl.textContent = formatTime(time);
}

function updateButtonState() {
  toggleBtn.textContent = isRunning ? '暂停' : '开始';
}

function updateTheme() {
  document.body.classList.toggle('light', !darkTheme);
  themeBtn.textContent = darkTheme ? '浅色' : '深色';
}

function loadSettings() {
  window.electronAPI.getSettings().then(settings => {
    workDurationInput.value = settings.workDuration;
    breakDurationInput.value = settings.breakDuration;
    darkTheme = settings.darkTheme;
    updateTheme();
    updateDisplay(settings.workDuration * 60);
  });
}

function loadStats() {
  window.electronAPI.getStats().then(stats => {
    statsEl.textContent = `今日完成：工作 ${stats.workSessions} 次 | 休息 ${stats.breakSessions} 次`;
  });
}

document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && document.activeElement.tagName !== 'INPUT') {
    e.preventDefault();
    window.electronAPI.toggleTimer();
  }
});

toggleBtn.addEventListener('click', () => {
  window.electronAPI.toggleTimer();
});

resetBtn.addEventListener('click', () => {
  window.electronAPI.resetTimer();
});

settingsBtn.addEventListener('click', () => {
  settingsPanel.style.display = 'block';
});

closeSettingsBtn.addEventListener('click', () => {
  settingsPanel.style.display = 'none';
});

themeBtn.addEventListener('click', () => {
  darkTheme = !darkTheme;
  window.electronAPI.saveSettings({ darkTheme });
  updateTheme();
});

workDurationInput.addEventListener('change', () => {
  window.electronAPI.saveSettings({ workDuration: parseInt(workDurationInput.value) || 25 });
});

breakDurationInput.addEventListener('change', () => {
  window.electronAPI.saveSettings({ breakDuration: parseInt(breakDurationInput.value) || 5 });
});

resetStatsBtn.addEventListener('click', () => {
  window.electronAPI.resetStats();
  loadStats();
});

window.electronAPI.onTimeUpdate((time) => {
  updateDisplay(time);
});

window.electronAPI.onTimerState((state) => {
  isRunning = state.isRunning;
  isWorkSession = state.isWorkSession;
  updateButtonState();
  sessionLabelEl.textContent = isWorkSession ? '工作' : '休息';
});

window.electronAPI.onSessionComplete((session) => {
  isWorkSession = session.isWorkSession;
  sessionLabelEl.textContent = isWorkSession ? '工作' : '休息';
});

window.electronAPI.onStatsUpdate((stats) => {
  statsEl.textContent = `今日完成：工作 ${stats.workSessions} 次 | 休息 ${stats.breakSessions} 次`;
});

loadSettings();
loadStats();