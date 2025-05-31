// DOM Elements
const xpDisplay = document.getElementById('userXp');
const levelDisplay = document.getElementById('userLevel');

// Add XP points
function addXp(points) {
    const userId = auth.currentUser.uid;
    const userRef = db.collection('users').doc(userId);
    
    db.runTransaction(transaction => {
        return transaction.get(userRef).then(doc => {
            if (!doc.exists) {
                throw "Document does not exist!";
            }
            
            const currentXp = doc.data().xp || 0;
            const currentLevel = doc.data().level || 1;
            const newXp = currentXp + points;
            
            // Check for level up (100 XP per level)
            const newLevel = Math.floor(newXp / 100) + 1;
            
            transaction.update(userRef, {
                xp: newXp,
                level: newLevel,
                tasksCompleted: firebase.firestore.FieldValue.increment(1)
            });
            
            return { xp: newXp, level: newLevel };
        });
    })
    .then(result => {
        // Update UI
        xpDisplay.textContent = result.xp;
        levelDisplay.textContent = `Level ${result.level}`;
        
        // Add bounce animation
        xpDisplay.parentElement.classList.add('bounce');
        setTimeout(() => {
            xpDisplay.parentElement.classList.remove('bounce');
        }, 500);
        
        // Check for achievements
        checkAchievements(result.xp, result.level);
    })
    .catch(error => {
        console.error('Error adding XP:', error);
    });
}

// Check for achievements
function checkAchievements(xp, level) {
    // Implement achievement checks
    if (level >= 5) {
        showAchievement('Scholar', 'Reached Level 5!');
    }
    
    if (xp >= 500) {
        showAchievement('Dedicated Learner', 'Earned 500 XP!');
    }
}

// Show achievement notification
function showAchievement(title, description) {
    // Implement achievement notification
    console.log(`Achievement Unlocked: ${title} - ${description}`);
}

// Initialize XP display
auth.onAuthStateChanged(user => {
    if (user) {
        db.collection('users').doc(user.uid).onSnapshot(doc => {
            if (doc.exists) {
                const userData = doc.data();
                xpDisplay.textContent = userData.xp || 0;
                levelDisplay.textContent = `Level ${userData.level || 1}`;
            }
        });
    }
});