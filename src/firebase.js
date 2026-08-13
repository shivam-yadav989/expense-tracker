import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged 
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDil7ZfTY0aP-12Duk9Q67Jfj7HsTynk3I",
  authDomain: "expense-tracker-mern-e5ee1.firebaseapp.com",
  projectId: "expense-tracker-mern-e5ee1",
  storageBucket: "expense-tracker-mern-e5ee1.firebasestorage.app",
  messagingSenderId: "420709515258",
  appId: "1:420709515258:web:f7b05c8e6ce709203aae43",
  measurementId: "G-936RK90GKN"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export { 
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
};