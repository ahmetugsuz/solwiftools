// Import the necessary Firebase modules
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword } from "firebase/auth";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAM4OfjmVgEgqVaPpvIOOvxw5MY5fLOqtw",
  authDomain: "coin-craft-project.firebaseapp.com",
  projectId: "coin-craft-project",
  storageBucket: "coin-craft-project.firebasestorage.app",
  messagingSenderId: "240803205810",
  appId: "1:240803205810:web:32c5144456cef821c52fab",
  measurementId: "G-4WB11VNLE5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Google Sign-In function
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    console.log("Google Sign-In Successful:", result.user);
    return result.user;
  } catch (error) {
    console.error("Google Sign-In Error:", error);
  }
};

// **Email/Password Sign-In function (this is what was missing)**
export const signInWithEmail = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log("Email Sign-In Successful:", userCredential.user);
    return userCredential.user;
  } catch (error) {
    console.error("Email Sign-In Error:", error);
  }
};
