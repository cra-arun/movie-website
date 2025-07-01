import { auth } from './firebase-config.js';
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";

document.getElementById("loginBtn").addEventListener("click", () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      if (userCredential.user.emailVerified) {
        const redirectURL = localStorage.getItem("returnAfterLogin") || "study-store.html";
        localStorage.removeItem("returnAfterLogin");
        window.location.href = redirectURL;
      } else {
        alert("Please verify your email first.");
      }
    })
    .catch(err => {
      document.getElementById("err").textContent = err.message;
    });
});

document.getElementById("googleSignIn").addEventListener("click", () => {
  const provider = new GoogleAuthProvider();
  signInWithPopup(auth, provider)
    .then(() => {
      const redirectURL = localStorage.getItem("returnAfterLogin") || "study-store.html";
      localStorage.removeItem("returnAfterLogin");
      window.location.href = redirectURL;
    })
    .catch(err => {
      document.getElementById("err").textContent = err.message;
    });
});
