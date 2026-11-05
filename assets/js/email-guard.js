// =========================================================
// MUSEO DE LUCENA
// EMAIL VERIFICATION GUARD
// assets/js/email-guard.js
//
// Gamitin sa dashboard.html, client-dashboard.html, at iba pang
// protected pages para hindi makapasok ang hindi pa verified.
//
// Halimbawa (sa loob ng onAuthStateChanged mo):
//
//   import { requireVerifiedEmail } from "./email-guard.js";
//
//   onAuthStateChanged(auth, async user => {
//     if (!user) { window.location.replace("login.html"); return; }
//     if (!(await requireVerifiedEmail(auth, user))) return;
//     // ...tuloy ang normal na dashboard code mo...
//   });
// =========================================================

import {
  signOut
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

export async function requireVerifiedEmail(auth, user) {
  try {
    if (user.emailVerified) {
      return true;
    }

  } catch (error) {
    console.error("Email guard error:", error);
  }

  try {
    await signOut(auth);
  } catch (_) {}

  window.location.replace("login.html");
  return false;
}