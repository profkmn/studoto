// DOM Elements
const timerDisplay = document.getElementById('timerDisplay');
const startBtn = document.getElementById('startPomodoro');
const pauseBtn = document.getElementById('pausePomodoro');
const resetBtn = document.getElementById('resetPomodoro');
const studyTimeInput = document.getElementById('studyTime');
const breakTimeInput = document.getElementById('breakTime');
const statusDisplay = document.getElementById('pomodoroStatus');

// Timer variables
let timer;
let isRunning = false;
let isStudyTime = true;
let timeLeft = 25 * 60;
let totalSessions = 0;

// Initialize timer display
updateDisplay();

// Event listeners
startBtn.addEventListener('click', startTimer);
pauseBtn.addEventListener('click', pauseTimer);
resetBtn.addEventListener('click', resetTimer);

studyTimeInput.addEventListener('change', () => {
    if (!isRunning && isStudyTime) {
        timeLeft = studyTimeInput.value * 60;
        updateDisplay();
    }
});

breakTimeInput.addEventListener('change', () => {
    if (!isRunning && !isStudyTime) {
        timeLeft = breakTimeInput.value * 60;
        updateDisplay();
    }
});

function startTimer() {
    if (isRunning) return;
    
    isRunning = true;
    updateStatus();
    
    timer = setInterval(() => {
        timeLeft--;
        updateDisplay();
        
        if (timeLeft <= 0) {
            clearInterval(timer);
            isRunning = false;
            playAlertSound();
            switchMode();
        }
    }, 1000);
}

function pauseTimer() {
    clearInterval(timer);
    isRunning = false;
    statusDisplay.textContent = 'Paused';
}

function resetTimer() {
    clearInterval(timer);
    isRunning = false;
    isStudyTime = true;
    timeLeft = studyTimeInput.value * 60;
    updateDisplay();
    statusDisplay.textContent = 'Ready to study!';
}

function switchMode() {
    isStudyTime = !isStudyTime;
    
    if (isStudyTime) {
        timeLeft = studyTimeInput.value * 60;
        totalSessions++;
        if (totalSessions % 4 === 0) {
            addXp(25);
        } else {
            addXp(10);
        }
    } else {
        timeLeft = breakTimeInput.value * 60;
    }
    
    updateDisplay();
    updateStatus();
}

function updateDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    if (isStudyTime) {
        timerDisplay.style.color = '#4361ee';
    } else {
        timerDisplay.style.color = '#4cc9f0';
    }
}

function updateStatus() {
    statusDisplay.textContent = isStudyTime 
        ? 'Studying...' 
        : 'On break...';
}

// Browser-based beep sound (no MP3 file needed)
function playAlertSound() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.value = 800;
        osc.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
        console.log("Audio not supported:", e);
    }
}

function addXp(points) {
    if (typeof window.addXp === 'function') {
        window.addXp(points);
    }
}