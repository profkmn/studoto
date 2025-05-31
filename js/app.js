// DOM Elements
const darkModeToggle = document.getElementById('darkModeToggle');
const tabs = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');

// Dark Mode Toggle
darkModeToggle.addEventListener('click', () => {
    document.body.setAttribute('data-theme', 
        document.body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
    
    // Save preference to localStorage
    localStorage.setItem('darkMode', document.body.getAttribute('data-theme'));
    
    // Update icon
    const icon = darkModeToggle.querySelector('i');
    if (document.body.getAttribute('data-theme') === 'dark') {
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
    } else {
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
    }
});

// Check for saved dark mode preference
if (localStorage.getItem('darkMode') === 'dark') {
    document.body.setAttribute('data-theme', 'dark');
    const icon = darkModeToggle.querySelector('i');
    icon.classList.remove('fa-moon');
    icon.classList.add('fa-sun');
}

// Tab Switching
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        // Remove active class from all tabs and contents
        tabs.forEach(t => t.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        
        // Add active class to clicked tab and corresponding content
        tab.classList.add('active');
        const tabId = tab.dataset.tab;
        document.getElementById(`${tabId}Tab`).classList.add('active');
    });
});

// Initialize Pomodoro Timer
let pomodoroInterval;
let isPomodoroRunning = false;
let isStudyTime = true;
let timeLeft = 25 * 60; // 25 minutes in seconds

const timerDisplay = document.getElementById('timerDisplay');
const startPomodoroBtn = document.getElementById('startPomodoro');
const pausePomodoroBtn = document.getElementById('pausePomodoro');
const resetPomodoroBtn = document.getElementById('resetPomodoro');
const studyTimeInput = document.getElementById('studyTime');
const breakTimeInput = document.getElementById('breakTime');
const pomodoroStatus = document.getElementById('pomodoroStatus');

// Format time as MM:SS
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Update timer display
function updateTimerDisplay() {
    timerDisplay.textContent = formatTime(timeLeft);
}

// Start timer
function startTimer() {
    if (isPomodoroRunning) return;
    
    isPomodoroRunning = true;
    pomodoroStatus.textContent = isStudyTime ? 'Studying...' : 'On break...';
    
    pomodoroInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        
        if (timeLeft <= 0) {
            clearInterval(pomodoroInterval);
            isPomodoroRunning = false;
            
            // Play sound
            const audio = new Audio('assets/alert.mp3');
            audio.play();
            
            // Switch mode
            isStudyTime = !isStudyTime;
            
            if (isStudyTime) {
                timeLeft = studyTimeInput.value * 60;
                pomodoroStatus.textContent = 'Study time! Ready to start?';
            } else {
                timeLeft = breakTimeInput.value * 60;
                pomodoroStatus.textContent = 'Break time! Ready to start?';
            }
            
            updateTimerDisplay();
        }
    }, 1000);
}

// Pause timer
function pauseTimer() {
    clearInterval(pomodoroInterval);
    isPomodoroRunning = false;
    pomodoroStatus.textContent = 'Paused';
}

// Reset timer
function resetTimer() {
    pauseTimer();
    isStudyTime = true;
    timeLeft = studyTimeInput.value * 60;
    pomodoroStatus.textContent = 'Ready to study!';
    updateTimerDisplay();
}

// Event listeners for timer controls
startPomodoroBtn.addEventListener('click', startTimer);
pausePomodoroBtn.addEventListener('click', pauseTimer);
resetPomodoroBtn.addEventListener('click', resetTimer);

// Update timer when settings change
studyTimeInput.addEventListener('change', () => {
    if (!isPomodoroRunning && isStudyTime) {
        timeLeft = studyTimeInput.value * 60;
        updateTimerDisplay();
    }
});

breakTimeInput.addEventListener('change', () => {
    if (!isPomodoroRunning && !isStudyTime) {
        timeLeft = breakTimeInput.value * 60;
        updateTimerDisplay();
    }
});

// Initialize timer display
updateTimerDisplay();

// Class Schedule Modal
const classModal = document.getElementById('classModal');
const addClassBtn = document.getElementById('addClassBtn');
const closeModalButtons = document.querySelectorAll('.close-modal');

addClassBtn.addEventListener('click', () => {
    classModal.classList.remove('hidden');
});

closeModalButtons.forEach(button => {
    button.addEventListener('click', () => {
        classModal.classList.add('hidden');
        taskDetailModal.classList.add('hidden');
    });
});

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === classModal) {
        classModal.classList.add('hidden');
    }
    if (e.target === taskDetailModal) {
        taskDetailModal.classList.add('hidden');
    }
});

// Task Detail Modal
const taskDetailModal = document.getElementById('taskDetailModal');

// Initialize weekly schedule
function initWeeklySchedule() {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const weeklySchedule = document.getElementById('weeklySchedule');
    
    weeklySchedule.innerHTML = '';
    
    days.forEach(day => {
        const dayColumn = document.createElement('div');
        dayColumn.className = 'day-column';
        dayColumn.innerHTML = `
            <div class="day-header">${day}</div>
            <div class="class-list" data-day="${day.toLowerCase()}"></div>
        `;
        
        weeklySchedule.appendChild(dayColumn);
    });
    
    // Load classes
    loadClasses();
}

// Load classes from Firestore
function loadClasses() {
    if (!auth.currentUser) return;
    
    db.collection('classes')
        .where('userId', '==', auth.currentUser.uid)
        .onSnapshot(snapshot => {
            const classLists = document.querySelectorAll('.class-list');
            classLists.forEach(list => list.innerHTML = '');
            
            snapshot.forEach(doc => {
                const classData = doc.data();
                const dayList = document.querySelector(`.class-list[data-day="${classData.day}"]`);
                
                if (dayList) {
                    const classItem = document.createElement('div');
                    classItem.className = 'class-item';
                    classItem.innerHTML = `
                        <div class="class-name">${classData.name}</div>
                        <div class="class-time">${classData.startTime} - ${classData.endTime}</div>
                        <div class="class-location">${classData.location || ''}</div>
                    `;
                    
                    dayList.appendChild(classItem);
                }
            });
        });
}

// Add new class
const classForm = document.getElementById('classForm');
classForm.addEventListener('submit', e => {
    e.preventDefault();
    
    const newClass = {
        name: document.getElementById('className').value,
        code: document.getElementById('classCode').value,
        day: document.getElementById('classDay').value,
        startTime: document.getElementById('classStartTime').value,
        endTime: document.getElementById('classEndTime').value,
        location: document.getElementById('classLocation').value,
        userId: auth.currentUser.uid
    };
    
    db.collection('classes').add(newClass)
        .then(() => {
            classForm.reset();
            classModal.classList.add('hidden');
        })
        .catch(error => {
            console.error('Error adding class:', error);
            alert('Failed to add class');
        });
});

// Initialize schedule when user is logged in
auth.onAuthStateChanged(user => {
    if (user) {
        initWeeklySchedule();
    }
});

// Countdown functionality
const countdownForm = document.getElementById('countdownForm');
const countdownList = document.getElementById('countdownList');

countdownForm.addEventListener('submit', e => {
    e.preventDefault();
    
    const countdownName = document.getElementById('countdownName').value;
    const countdownDate = new Date(document.getElementById('countdownDate').value);
    
    if (!countdownName || !countdownDate) return;
    
    const newCountdown = {
        name: countdownName,
        date: countdownDate,
        userId: auth.currentUser.uid,
        createdAt: new Date()
    };
    
    db.collection('countdowns').add(newCountdown)
        .then(() => {
            countdownForm.reset();
        })
        .catch(error => {
            console.error('Error adding countdown:', error);
            alert('Failed to add countdown');
        });
});

// Display countdowns
function displayCountdowns() {
    if (!auth.currentUser) return;
    
    db.collection('countdowns')
        .where('userId', '==', auth.currentUser.uid)
        .orderBy('date')
        .onSnapshot(snapshot => {
            countdownList.innerHTML = '';
            
            snapshot.forEach(doc => {
                const countdown = doc.data();
                const countdownId = doc.id;
                
                // Create countdown item
                const countdownItem = document.createElement('div');
                countdownItem.className = 'countdown-item';
                countdownItem.innerHTML = `
                    <div class="countdown-name">${countdown.name}</div>
                    <div class="countdown-timer" data-id="${countdownId}"></div>
                    <div class="countdown-date">${countdown.date.toLocaleDateString()}</div>
                    <button class="delete-countdown" data-id="${countdownId}">Delete</button>
                `;
                
                countdownList.appendChild(countdownItem);
            });
            
            // Update all countdown timers
            updateCountdownTimers();
            
            // Add event listeners to delete buttons
            document.querySelectorAll('.delete-countdown').forEach(button => {
                button.addEventListener('click', e => {
                    const countdownId = e.currentTarget.dataset.id;
                    db.collection('countdowns').doc(countdownId).delete()
                        .catch(error => {
                            console.error('Error deleting countdown:', error);
                        });
                });
            });
        });
}

// Update countdown timers
function updateCountdownTimers() {
    const now = new Date();
    
    document.querySelectorAll('.countdown-timer').forEach(timer => {
        const countdownId = timer.dataset.id;
        
        db.collection('countdowns').doc(countdownId).get()
            .then(doc => {
                if (doc.exists) {
                    const countdownDate = doc.data().date.toDate();
                    const diff = countdownDate - now;
                    
                    if (diff <= 0) {
                        timer.textContent = 'Time\'s up!';
                        return;
                    }
                    
                    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
                    
                    if (days > 0) {
                        timer.textContent = `${days}d ${hours}h ${minutes}m`;
                    } else if (hours > 0) {
                        timer.textContent = `${hours}h ${minutes}m ${seconds}s`;
                    } else {
                        timer.textContent = `${minutes}m ${seconds}s`;
                    }
                }
            });
    });
}

// Update countdowns every second
setInterval(updateCountdownTimers, 1000);

// Initialize countdowns when user is logged in
auth.onAuthStateChanged(user => {
    if (user) {
        displayCountdowns();
    }
});