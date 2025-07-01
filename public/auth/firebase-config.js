// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { 
  getAuth, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendEmailVerification,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDa0FRuvd0MuR6IzgHD7pf_sFdcPbfqBCg",
  authDomain: "moviewatchlist-arun.firebaseapp.com",
  projectId: "moviewatchlist-arun",
  storageBucket: "moviewatchlist-arun.appspot.com",
  messagingSenderId: "966642505275",
  appId: "1:966642505275:web:17cd17979be082c7b02e1e"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { 
  auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  googleProvider,
  sendEmailVerification,
  onAuthStateChanged
};