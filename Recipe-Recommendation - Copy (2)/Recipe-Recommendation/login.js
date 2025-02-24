// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyA24BMQXIYD-jZY5Yb3s9ChtgqsewCclX0",
    authDomain: "tasty-hub-944d3.firebaseapp.com",
    databaseURL: "https://tasty-hub-944d3-default-rtdb.firebaseio.com",
    projectId: "tasty-hub-944d3",
    storageBucket: "tasty-hub-944d3.appspot.com",
    messagingSenderId: "579351265282",
    appId: "1:579351265282:web:ebc7476d8990521252e71b",
    measurementId: "G-FP3WWDV0RP"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();

// DOM Elements
const container = document.getElementById('container');
const registerBtn = document.getElementById('register');
const loginBtn = document.getElementById('login');
const signupForm = document.getElementById('signup-form');
const loginForm = document.getElementById('login-form');

// Toggle Forms
registerBtn.addEventListener('click', () => container.classList.add("active"));
loginBtn.addEventListener('click', () => container.classList.remove("active"));

// Signup Event
signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;

    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // Store additional user data in Realtime Database
        await database.ref('users/' + user.uid).set({
            name: name,
            email: email,
        });

        alert("Signup successful! You can now log in.");
        container.classList.remove("active"); // Switch to login form
    } catch (error) {
        console.error("Signup failed:", error.message);
        alert("Signup failed: " + error.message);
    }
});

// Login Event
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        await auth.signInWithEmailAndPassword(email, password);
        alert("Login successful!");
        window.location.href = "intro.html"; // Redirect to dashboard
    } catch (error) {
        console.error("Login failed:", error.message);
        alert("Login failed: " + error.message);
    }
});
