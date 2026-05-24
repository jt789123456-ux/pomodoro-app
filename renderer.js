const toggleBtn = document.getElementById('toggleBtn');
const resetBtn = document.getElementById('resetBtn');
const sessionLabelEl = document.getElementById('sessionLabel');
const timerEl = document.getElementById('timer');

let isRunning = false;
let isWorkSession = true;

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

toggleBtn.addEventListener('click', () => {
  window.electronAPI.toggleTimer();
});

resetBtn.addEventListener('click', () => {
  window.electronAPI.resetTimer();
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

updateDisplay(remainingTime);