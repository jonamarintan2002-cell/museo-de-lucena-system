// =========================================================
// MUSEO DE LUCENA
// AUTHENTICATION (Password + Email Verification)
// assets/js/auth.js
// ADMIN + STAFF + CLIENT
//
// FREE VERSION: works on the Firebase Spark plan.
// No Cloud Functions, no secrets, no billing needed.
// =========================================================

import { auth, db } from "./firebase-config.js";

import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";


// =========================================================
// STATE
// =========================================================

let isLoggingIn = false;
let initialSessionChecked = false;


// =========================================================
// ELEMENTS
// =========================================================

const $ = id => document.getElementById(id);

const loginForm = $("loginForm");
const emailInput = $("email");
const passwordInput = $("password");
const loginButton = $("loginButton");
const loginButtonText = $("loginButtonText");
const loginSpinner = $("loginSpinner");
const loginMessage = $("loginMessage");
const togglePassword = $("togglePassword");

// Forgot password
const forgotPasswordButton = $("forgotPasswordButton");
const passwordModal = $("passwordModal");
const closePasswordModal = $("closePasswordModal");
const resetPasswordForm = $("resetPasswordForm");
const resetEmailInput = $("resetEmail");
const resetPasswordButton = $("resetPasswordButton");
const resetPasswordMessage = $("resetPasswordMessage");


// =========================================================
// MESSAGES
// =========================================================

function showMessage(message, type = "error") {
  if (!loginMessage) return;
  loginMessage.textContent = message;
  loginMessage.className = `login-message show ${type}`;
}

function clearMessage() {
  if (!loginMessage) return;
  loginMessage.textContent = "";
  loginMessage.className = "login-message";
}


// =========================================================
// LOADING STATE
// =========================================================

function setLoading(isLoading) {
  if (loginButton) loginButton.disabled = isLoading;

  if (loginButtonText) {
    loginButtonText.textContent = isLoading ? "Signing in..." : "Sign In";
  }

  if (loginSpinner) {
    loginSpinner.classList.toggle("show", isLoading);
  }
}


// =========================================================
// PASSWORD TOGGLE
// =========================================================

togglePassword?.addEventListener("click", () => {
  const hidden = passwordInput.type === "password";

  passwordInput.type = hidden ? "text" : "password";
  togglePassword.textContent = hidden ? "Hide" : "Show";
  togglePassword.setAttribute(
    "aria-label",
    hidden ? "Hide password" : "Show password"
  );
});


// =========================================================
// FORGOT PASSWORD MODAL
// =========================================================

function openPasswordModal() {
  if (!passwordModal) return;

  passwordModal.classList.add("show");
  passwordModal.setAttribute("aria-hidden", "false");

  if (resetEmailInput) {
    resetEmailInput.value = emailInput?.value?.trim()?.toLowerCase() || "";
    setTimeout(() => resetEmailInput.focus(), 50);
  }
}

function closePasswordResetModal() {
  if (!passwordModal) return;

  passwordModal.classList.remove("show");
  passwordModal.setAttribute("aria-hidden", "true");

  if (resetPasswordMessage) {
    resetPasswordMessage.textContent = "";
    resetPasswordMessage.className = "reset-password-message";
  }
}

forgotPasswordButton?.addEventListener("click", openPasswordModal);
closePasswordModal?.addEventListener("click", closePasswordResetModal);

passwordModal?.addEventListener("click", event => {
  if (event.target === passwordModal) closePasswordResetModal();
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape" && passwordModal?.classList.contains("show")) {
    closePasswordResetModal();
  }
});

function showResetMessage(message, type = "error") {
  if (!resetPasswordMessage) return;
  resetPasswordMessage.textContent = message;
  resetPasswordMessage.className = `reset-password-message show ${type}`;
}

resetPasswordForm?.addEventListener("submit", async event => {
  event.preventDefault();

  if (!resetEmailInput) return;

  const email = resetEmailInput.value.trim().toLowerCase();

  if (!email) {
    showResetMessage("Please enter your email address.");
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showResetMessage("Please enter a valid email address.");
    return;
  }

  if (resetPasswordButton) {
    resetPasswordButton.disabled = true;
    resetPasswordButton.textContent = "Sending...";
  }

  try {
    await sendPasswordResetEmail(auth, email);

    showResetMessage(
      "Password reset link sent. Please check your email inbox and follow the instructions.",
      "success"
    );

    resetPasswordForm.reset();

  } catch (error) {
    console.error("Password reset error:", error);

    const messages = {
      "auth/invalid-email": "Please enter a valid email address.",
      "auth/user-not-found": "No account was found with that email address.",
      "auth/user-disabled": "This account has been disabled. Please contact the system administrator.",
      "auth/too-many-requests": "Too many reset attempts. Please wait before trying again.",
      "auth/network-request-failed": "Network connection failed. Please check your internet connection."
    };

    showResetMessage(
      messages[error.code] ||
      "Unable to send the password reset email. Please try again."
    );

  } finally {
    if (resetPasswordButton) {
      resetPasswordButton.disabled = false;
      resetPasswordButton.textContent = "Send Reset Link";
    }
  }
});


// =========================================================
// FIRESTORE USER PROFILE
// =========================================================

async function getUserProfile(uid) {
  const snapshot = await getDoc(doc(db, "users", uid));

  if (!snapshot.exists()) {
    throw new Error("PROFILE_NOT_FOUND");
  }

  return { id: snapshot.id, ...snapshot.data() };
}

function normalizeRole(role) {
  return String(role || "").trim().toLowerCase();
}

function getRoleHomePage(role) {
  switch (normalizeRole(role)) {
    case "admin":
    case "staff":
      return "dashboard.html";
    case "client":
      return "client-dashboard.html";
    default:
      return null;
  }
}


// =========================================================
// LOGIN
// =========================================================

loginForm?.addEventListener("submit", async event => {
  event.preventDefault();
  clearMessage();

  const email = emailInput.value.trim().toLowerCase();
  const password = passwordInput.value;

  if (!email || !password) {
    showMessage("Please enter your email address and password.");
    return;
  }

  isLoggingIn = true;
  setLoading(true);

  try {
    // 1. Firebase Authentication (email + password)
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const user = credential.user;

    // 2. Email verification check (done BEFORE reading Firestore,
    //    so unverified users are stopped immediately)
    await user.reload();

    if (!user.emailVerified) {
      let linkSent = true;

      try {
        await sendEmailVerification(user);
      } catch (verifyError) {
        console.error("Verification email error:", verifyError);
        linkSent = false;
      }

      await signOut(auth);

      throw new Error(
        linkSent ? "EMAIL_NOT_VERIFIED_SENT" : "EMAIL_NOT_VERIFIED"
      );
    }

    // 3. Firestore profile
    const profile = await getUserProfile(user.uid);
    const role = normalizeRole(profile.role);

    // 4. Account status
    const status = String(profile.status || "").trim().toLowerCase();

    if (status !== "active") {
      await signOut(auth);
      throw new Error("ACCOUNT_INACTIVE");
    }

    // 5. Role check
    const destination = getRoleHomePage(role);

    if (!["admin", "staff", "client"].includes(role) || !destination) {
      await signOut(auth);
      throw new Error("ROLE_NOT_ALLOWED");
    }

    // 5.5 I-save ang pangalan at role para instant na ito sa dashboard
    try {
      localStorage.setItem(
        "museo_dashboard_profile_v1",
        JSON.stringify({
          fullName: profile.fullName,
          role
        })
      );
    } catch (_) {}

    // 6. Success
    showMessage(
      role === "client"
        ? "Client login successful. Opening client portal..."
        : "Login successful. Redirecting...",
      "success"
    );

    setTimeout(() => {
      window.location.replace(destination);
    }, 500);

  } catch (error) {
    console.error("Login error:", error);

    isLoggingIn = false;

    let message =
      `Unable to sign in (${error.code || error.message || "unknown error"}). Please check your account credentials.`;

    const authMessages = {
      "auth/invalid-credential": "Incorrect email address or password.",
      "auth/wrong-password": "Incorrect email address or password.",
      "auth/user-not-found": "No account was found with that email address.",
      "permission-denied": "Signed in, but the database denied access. Please check the Firestore security rules.",
      "unavailable": "The database is unreachable. Please check your internet connection.",
      "auth/invalid-email": "Please enter a valid email address.",
      "auth/too-many-requests": "Too many unsuccessful login attempts. Please try again later.",
      "auth/network-request-failed": "Network connection failed. Please check your internet connection.",
      "auth/user-disabled": "This authentication account has been disabled."
    };

    if (authMessages[error.code]) {
      message = authMessages[error.code];
    }

    switch (error.message) {

      case "EMAIL_NOT_VERIFIED_SENT":
        message =
          "Your email address is not verified yet. We sent a verification link to your email. Please click it (check Spam too), then sign in again.";
        break;

      case "EMAIL_NOT_VERIFIED":
        message =
          "Your email address is not verified yet. A verification link was sent recently, so please check your inbox or Spam folder, then try again in a few minutes.";
        break;

      case "PROFILE_NOT_FOUND":
        message =
          "Your account exists, but no authorized system profile was found.";
        try { await signOut(auth); } catch (_) {}
        break;

      case "ACCOUNT_INACTIVE":
        message =
          "This account is currently inactive. Please contact the system administrator.";
        break;

      case "ROLE_NOT_ALLOWED":
        message =
          "This account role is not authorized to access the Museo de Lucena system.";
        break;
    }

    // Verification notices are informational, not hard errors.
    const isNotice =
      error.message === "EMAIL_NOT_VERIFIED_SENT" ||
      error.message === "EMAIL_NOT_VERIFIED";

    showMessage(message, isNotice ? "success" : "error");
    setLoading(false);
  }
});


// =========================================================
// LOGIN PAGE SESSION HANDLING
// =========================================================
// Opening login.html clears any old remembered session so
// the user must intentionally sign in.
// =========================================================

onAuthStateChanged(auth, async user => {
  if (isLoggingIn) return;
  if (initialSessionChecked) return;

  initialSessionChecked = true;

  if (user) {
    try {
      await signOut(auth);
      console.log("Previous login session cleared.");
    } catch (error) {
      console.error("Unable to clear previous session:", error);
    }
  }
});