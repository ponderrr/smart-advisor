import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Sign-Up Function
async function signup(email, password, age) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Save additional user information in Firestore
        await setDoc(doc(db, "users", user.uid), {
            email: user.email,
            age: age,
            preferences: [] // Initialize with an empty preferences list
        });

        console.log("User signed up and details saved to Firestore:", user);
        alert("Sign-up successful!");
        // Redirect to home or login page if necessary
    } catch (error) {
        console.error("Error during sign-up:", error.message);
        alert(`Sign-up failed: ${error.message}`);
    }
}

// Event listener for the Sign-Up form
document.getElementById("signUpForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const age = document.getElementById("age").value;
    await signup(email, password, age);
});

// Login Function
async function login(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log("User logged in:", user);
        alert("Login successful!");
        // Redirect to the home page or questionnaire page after login
    } catch (error) {
        console.error("Error during login:", error.message);
        alert(`Login failed: ${error.message}`);
    }
}

// Event listener for the Sign-In form
document.getElementById("signInForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    await login(email, password);
});

// Google Sign-In Function
async function googleLogin() {
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        // Check if user data exists in Firestore
        const userRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userRef);

        // If the user is new, save their information in Firestore
        if (!userDoc.exists()) {
            await setDoc(userRef, {
                email: user.email,
                age: null, // Ask for age separately if needed
                preferences: []
            });
        }

        console.log("User signed in with Google:", user);
        alert("Google login successful!");
    } catch (error) {
        console.error("Google login error:", error.message);
        alert(`Google login failed: ${error.message}`);
    }
}
