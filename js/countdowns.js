// DOM Elements
const countdownForm = document.getElementById('countdownForm');
const countdownNameInput = document.getElementById('countdownName');
const countdownDateInput = document.getElementById('countdownDate');
const countdownList = document.getElementById('countdownList');

// Initialize countdowns when user logs in
auth.onAuthStateChanged(user => {
    if (user) {
        loadCountdowns();
    }
});

// Load countdowns from Firestore
function loadCountdowns() {
    db.collection('countdowns')
        .where('userId', '==', auth.currentUser.uid)
        .orderBy('date')
        .onSnapshot(snapshot => {
            countdownList.innerHTML = '';
            
            snapshot.forEach(doc => {
                const countdown = doc.data();
                addCountdownToDOM(doc.id, countdown);
            });
            
            // Start updating all countdowns
            updateAllCountdowns();
        });
}

// Add new countdown
countdownForm.addEventListener('submit', e => {
    e.preventDefault();
    
    const name = countdownNameInput.value.trim();
    const date = new Date(countdownDateInput.value);
    
    if (!name || !date) return;
    
    db.collection('countdowns').add({
        name,
        date,
        userId: auth.currentUser.uid,
        createdAt: new Date()
    })
    .then(() => {
        countdownNameInput.value = '';
        countdownDateInput.value = '';
    })
    .catch(error => {
        console.error('Error adding countdown:', error);
        alert('Failed to add countdown');
    });
});

// Add countdown to DOM
function addCountdownToDOM(id, countdown) {
    const countdownElement = document.createElement('div');
    countdownElement.className = 'countdown-item';
    countdownElement.dataset.id = id;
    countdownElement.innerHTML = `
        <div class="countdown-name">${countdown.name}</div>
        <div class="countdown-timer"></div>
        <div class="countdown-date">${countdown.date.toLocaleDateString()}</div>
        <button class="delete-countdown">
            <i class="fas fa-trash"></i>
        </button>
    `;
    
    countdownList.appendChild(countdownElement);
    
    // Add delete functionality
    const deleteBtn = countdownElement.querySelector('.delete-countdown');
    deleteBtn.addEventListener('click', () => deleteCountdown(id));
}

// Delete countdown
function deleteCountdown(id) {
    if (confirm('Are you sure you want to delete this countdown?')) {
        db.collection('countdowns').doc(id).delete()
            .catch(error => {
                console.error('Error deleting countdown:', error);
                alert('Failed to delete countdown');
            });
    }
}

// Update all countdown timers
function updateAllCountdowns() {
    const now = new Date();
    
    document.querySelectorAll('.countdown-item').forEach(item => {
        const id = item.dataset.id;
        const timerElement = item.querySelector('.countdown-timer');
        
        db.collection('countdowns').doc(id).get()
            .then(doc => {
                if (doc.exists) {
                    const countdown = doc.data();
                    const targetDate = countdown.date.toDate();
                    const diff = targetDate - now;
                    
                    if (diff <= 0) {
                        timerElement.textContent = 'Time\'s up!';
                        timerElement.style.color = '#f72585';
                        return;
                    }
                    
                    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
                    
                    // Color coding based on urgency
                    if (days < 7) timerElement.style.color = '#f8961e'; // Orange for < 1 week
                    if (days < 3) timerElement.style.color = '#f72585'; // Red for < 3 days
                    
                    if (days > 0) {
                        timerElement.textContent = `${days}d ${hours}h ${minutes}m`;
                    } else if (hours > 0) {
                        timerElement.textContent = `${hours}h ${minutes}m ${seconds}s`;
                    } else {
                        timerElement.textContent = `${minutes}m ${seconds}s`;
                    }
                }
            });
    });
}

// Update countdowns every second
setInterval(updateAllCountdowns, 1000);