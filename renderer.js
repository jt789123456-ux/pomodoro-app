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
const progressRing = document.getElementById('progressRing');
const timerContainerEl = document.querySelector('.timer-container');

let isRunning = false;
let isWorkSession = true;
let darkTheme = true;
let soundInterval = null;
let audioContext = null;
let totalTime = 25 * 60;

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function updateDisplay(time) {
  timerEl.textContent = formatTime(time);
  updateProgress(time);
}

function updateProgress(time) {
  const progress = totalTime > 0 ? (totalTime - time) / totalTime : 0;
  const circumference = 2 * Math.PI * 90;
  progressRing.style.strokeDashoffset = circumference * (1 - progress);
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
    totalTime = settings.workDuration * 60;
    updateDisplay(settings.workDuration * 60);
  });
}

function loadStats() {
  window.electronAPI.getStats().then(stats => {
    statsEl.textContent = `今日完成：工作 ${stats.workSessions} 次 | 休息 ${stats.breakSessions} 次`;
  });
}

function playAlarmSound() {
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.frequency.value = 880;
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch (e) {}
}

function startAlarm() {
  stopAlarm();
  playAlarmSound();
  soundInterval = setInterval(playAlarmSound, 1500);
}

function stopAlarm() {
  if (soundInterval) {
    clearInterval(soundInterval);
    soundInterval = null;
  }
}

document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && document.activeElement.tagName !== 'INPUT') {
    e.preventDefault();
    stopAlarm();
    window.electronAPI.toggleTimer();
  }
});

toggleBtn.addEventListener('click', () => {
  stopAlarm();
  window.electronAPI.toggleTimer();
});

resetBtn.addEventListener('click', () => {
  stopAlarm();
  window.electronAPI.resetTimer();
});

settingsBtn.addEventListener('click', () => {
  settingsPanel.style.display = 'flex';
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
  timerEl.classList.toggle('running', isRunning);
  timerEl.classList.remove('complete');
  timerContainerEl.classList.toggle('running', isRunning);
});

window.electronAPI.onSessionComplete((session) => {
  isWorkSession = session.isWorkSession;
  sessionLabelEl.textContent = isWorkSession ? '工作' : '休息';
  window.electronAPI.getSettings().then(settings => {
    totalTime = isWorkSession ? settings.workDuration * 60 : settings.breakDuration * 60;
  });
  timerEl.classList.remove('running');
  timerContainerEl.classList.remove('running');
  timerEl.classList.add('complete');
});

window.electronAPI.onStatsUpdate((stats) => {
  statsEl.textContent = `今日完成：工作 ${stats.workSessions} 次 | 休息 ${stats.breakSessions} 次`;
});

window.electronAPI.onPlaySoundStart(() => {
  startAlarm();
});

window.electronAPI.onStopSound(() => {
  stopAlarm();
});

loadSettings();
loadStats();