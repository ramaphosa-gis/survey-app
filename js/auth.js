// auth.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

// ===== Your Firebase config =====
const firebaseConfig = {
  apiKey: "AIzaSyD3La6BOzBUnybZy_OhCt54UEeWjaAD0XY",
  authDomain: "homeland-d1159.firebaseapp.com",
  projectId: "homeland-d1159",
  storageBucket: "homeland-d1159.firebasestorage.app",
  messagingSenderId: "429299746991",
  appId: "1:429299746991:web:9d4f06f0051ba693ef2c5a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// ===== SIGNUP FUNCTION =====
const signupBtn = document.getElementById('signup-btn');
if (signupBtn) {
    signupBtn.addEventListener('click', async () => {
        const email = document.getElementById('signup-email').value.trim();
        const password = document.getElementById('signup-password').value.trim();
        const errorEl = document.getElementById('signup-error');

        if (!email || !password) {
            errorEl.textContent = "Please enter both email and password.";
            return;
        }

        try {
            await createUserWithEmailAndPassword(auth, email, password);
            // Redirect to login page after successful signup
            window.location.href = 'login.html';
        } catch (error) {
            errorEl.textContent = error.message;
        }
    });
}

// ===== LOGIN FUNCTION =====
const loginBtn = document.getElementById('login-btn');
if (loginBtn) {
    loginBtn.addEventListener('click', async () => {
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value.trim();
        const errorEl = document.getElementById('login-error');

        if (!email || !password) {
            errorEl.textContent = "Please enter both email and password.";
            return;
        }

        try {
            await signInWithEmailAndPassword(auth, email, password);
            // Redirect to dashboard after successful login
            window.location.href = 'app.html';
        } catch (error) {
            errorEl.textContent = error.message;
        }
    });
}
