// DOM Elements
const suggestionText = document.getElementById('suggestionText');

// Generate AI suggestions
function generateSuggestions() {
    // Get current time
    const now = new Date();
    const currentHour = now.getHours();
    
    // Check for free time slots
    checkFreeTimeSlots().then(freeSlots => {
        if (freeSlots.length > 0) {
            const nextSlot = freeSlots[0];
            const hoursFree = nextSlot.endHour - nextSlot.startHour;
            
            // Get pending tasks
            db.collection('tasks')
                .where('userId', '==', auth.currentUser.uid)
                .where('completed', '==', false)
                .orderBy('dueDate', 'asc')
                .limit(1)
                .get()
                .then(snapshot => {
                    if (!snapshot.empty) {
                        const nextTask = snapshot.docs[0].data();
                        
                        // Generate suggestion
                        suggestionText.innerHTML = `
                            You have ${hoursFree} hour${hoursFree > 1 ? 's' : ''} free 
                            ${nextSlot.startHour > 12 ? nextSlot.startHour - 12 : nextSlot.startHour}${nextSlot.startHour >= 12 ? 'PM' : 'AM'}.
                            <br><br>
                            <strong>Suggested activity:</strong> Work on "${nextTask.text}"
                        `;
                    }
                });
        } else if (currentHour < 12) {
            suggestionText.textContent = "Good morning! Time to plan your day.";
        } else if (currentHour < 18) {
            suggestionText.textContent = "Good afternoon! How's your productivity going?";
        } else {
            suggestionText.textContent = "Good evening! Remember to review tomorrow's schedule.";
        }
    });
}

// Check for free time slots in schedule
function checkFreeTimeSlots() {
    return new Promise(resolve => {
        // Get today's classes
        const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        
        db.collection('classes')
            .where('userId', '==', auth.currentUser.uid)
            .where('day', '==', today)
            .orderBy('startTime')
            .get()
            .then(snapshot => {
                const classes = [];
                snapshot.forEach(doc => {
                    classes.push(doc.data());
                });
                
                // Find gaps between classes
                const freeSlots = [];
                const now = new Date();
                const currentHour = now.getHours();
                
                if (classes.length === 0) {
                    // No classes today
                    freeSlots.push({
                        startHour: currentHour,
                        endHour: 24,
                        duration: 24 - currentHour
                    });
                } else {
                    // Check before first class
                    const firstClass = classes[0];
                    const firstClassHour = parseInt(firstClass.startTime.split(':')[0]);
                    
                    if (currentHour < firstClassHour) {
                        freeSlots.push({
                            startHour: currentHour,
                            endHour: firstClassHour,
                            duration: firstClassHour - currentHour
                        });
                    }
                    
                    // Check between classes
                    for (let i = 0; i < classes.length - 1; i++) {
                        const currentClass = classes[i];
                        const nextClass = classes[i + 1];
                        
                        const currentEndHour = parseInt(currentClass.endTime.split(':')[0]);
                        const nextStartHour = parseInt(nextClass.startTime.split(':')[0]);
                        
                        if (nextStartHour - currentEndHour >= 1) {
                            freeSlots.push({
                                startHour: currentEndHour,
                                endHour: nextStartHour,
                                duration: nextStartHour - currentEndHour
                            });
                        }
                    }
                    
                    // Check after last class
                    const lastClass = classes[classes.length - 1];
                    const lastClassEndHour = parseInt(lastClass.endTime.split(':')[0]);
                    
                    if (lastClassEndHour < 22) { // Until 10 PM
                        freeSlots.push({
                            startHour: lastClassEndHour,
                            endHour: 22,
                            duration: 22 - lastClassEndHour
                        });
                    }
                }
                
                resolve(freeSlots);
            })
            .catch(error => {
                console.error('Error checking schedule:', error);
                resolve([]);
            });
    });
}

// Update suggestions periodically
setInterval(generateSuggestions, 60000); // Every minute

// Initialize suggestions when user is logged in
auth.onAuthStateChanged(user => {
    if (user) {
        generateSuggestions();
    }
});