// DOM Elements
const authSection = document.getElementById('authSection');
const appContainer = document.getElementById('appContainer');
const googleLoginBtn = document.getElementById('googleLogin');
const githubLoginBtn = document.getElementById('githubLogin');
const emailAuthForm = document.getElementById('emailAuthForm');
const emailLoginBtn = document.getElementById('emailLogin');
const signUpBtn = document.getElementById('signUp');
const guestLoginBtn = document.getElementById('guestLogin');
const logoutBtn = document.getElementById('logoutBtn');
const userPhoto = document.getElementById('userPhoto');
const userName = document.getElementById('userName');

// Auth State Listener
auth.onAuthStateChanged(user => {
    if (user) {
        authSection.classList.add('hidden');
        appContainer.classList.remove('hidden');
        updateUserInfo(user);
        initUserData(user.uid);
    } else {
        authSection.classList.remove('hidden');
        appContainer.classList.add('hidden');
    }
});

// Update user info in UI
function updateUserInfo(user) {
    if (user.photoURL) {
        userPhoto.src = user.photoURL;
    } else {
        // Use Font Awesome icon instead of missing image
        userPhoto.innerHTML = '<i class="fas fa-user-circle fa-2x"></i>';
        userPhoto.style.fontSize = '40px';
        userPhoto.style.color = '#4361ee';
    }
    
    if (user.displayName) {
        userName.textContent = user.displayName;
    } else if (user.email) {
        userName.textContent = user.email;
    } else {
        userName.textContent = 'Guest User';
    }
}

// ... (rest of the auth.js file remains exactly the same)



// Google Login
googleLoginBtn.addEventListener('click', () => {
    auth.signInWithPopup(googleProvider)
        .catch(error => {
            console.error('Google login error:', error);
            alert(error.message);
        });
});

// GitHub Login
githubLoginBtn.addEventListener('click', () => {
    auth.signInWithPopup(githubProvider)
        .catch(error => {
            console.error('GitHub login error:', error);
            alert(error.message);
        });
});

// Email Login/Signup
emailAuthForm.addEventListener('submit', e => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (e.submitter.id === 'emailLogin') {
        // Login
        auth.signInWithEmailAndPassword(email, password)
            .catch(error => {
                console.error('Login error:', error);
                alert(error.message);
            });
    } else {
        // Sign up
        auth.createUserWithEmailAndPassword(email, password)
            .catch(error => {
                console.error('Signup error:', error);
                alert(error.message);
            });
    }
});

// Guest Login
guestLoginBtn.addEventListener('click', () => {
    auth.signInAnonymously()
        .catch(error => {
            console.error('Guest login error:', error);
            alert(error.message);
        });
});

// Logout
logoutBtn.addEventListener('click', () => {
    auth.signOut()
        .catch(error => {
            console.error('Logout error:', error);
            alert(error.message);
        });
});

// Update user info in UI
function updateUserInfo(user) {
    if (user.photoURL) {
        userPhoto.src = user.photoURL;
    } else {
        // Default user icon
        userPhoto.src = 'assets/default-user.png';
    }
    
    if (user.displayName) {
        userName.textContent = user.displayName;
    } else if (user.email) {
        userName.textContent = user.email;
    } else {
        userName.textContent = 'Guest User';
    }
}

// Initialize user data in Firestore
function initUserData(userId) {
    const userRef = db.collection('users').doc(userId);
    
    userRef.get().then(doc => {
        if (!doc.exists) {
            // Create new user document
            userRef.set({
                xp: 0,
                level: 1,
                tasksCompleted: 0,
                lastLogin: new Date()
            });
        } else {
            // Update last login
            userRef.update({
                lastLogin: new Date()
            });
        }
    });
}