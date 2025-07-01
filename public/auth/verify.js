import { auth } from './firebase-config.js';
import { reload } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";

document.getElementById("openGmail").addEventListener("click", () => {
  window.open("https://mail.google.com/", "_blank");
});

document.getElementById("checkVerified").addEventListener("click", async () => {
  const user = auth.currentUser;
  if (user) {
    await reload(user);
    if (user.emailVerified) {
      window.location.href = "verified.html";
    } else {
      document.getElementById("msg").textContent = "Email not yet verified.";
    }
  }
});
