// =========================================================
// MUSEO DE LUCENA
// AUTHENTICATION
// assets/js/auth.js
// ADMIN + STAFF + CLIENT
// =========================================================

import {
  auth,
  db
} from "./firebase-config.js";


import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
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

const loginForm =
  document.getElementById(
    "loginForm"
  );


const emailInput =
  document.getElementById(
    "email"
  );


const passwordInput =
  document.getElementById(
    "password"
  );


const loginButton =
  document.getElementById(
    "loginButton"
  );


const loginButtonText =
  document.getElementById(
    "loginButtonText"
  );


const loginSpinner =
  document.getElementById(
    "loginSpinner"
  );


const loginMessage =
  document.getElementById(
    "loginMessage"
  );


const togglePassword =
  document.getElementById(
    "togglePassword"
  );


// =========================================================
// FORGOT PASSWORD ELEMENTS
// =========================================================

const forgotPasswordButton =
  document.getElementById(
    "forgotPasswordButton"
  );


const passwordModal =
  document.getElementById(
    "passwordModal"
  );


const closePasswordModal =
  document.getElementById(
    "closePasswordModal"
  );


const resetPasswordForm =
  document.getElementById(
    "resetPasswordForm"
  );


const resetEmailInput =
  document.getElementById(
    "resetEmail"
  );


const resetPasswordButton =
  document.getElementById(
    "resetPasswordButton"
  );


const resetPasswordMessage =
  document.getElementById(
    "resetPasswordMessage"
  );


// =========================================================
// MESSAGE
// =========================================================

function showMessage(
  message,
  type = "error"
) {

  if (!loginMessage) {
    return;
  }


  loginMessage.textContent =
    message;


  loginMessage.className =
    `login-message show ${type}`;

}


// =========================================================
// CLEAR MESSAGE
// =========================================================

function clearMessage() {

  if (!loginMessage) {
    return;
  }


  loginMessage.textContent =
    "";


  loginMessage.className =
    "login-message";

}


// =========================================================
// LOADING STATE
// =========================================================

function setLoading(
  isLoading
) {

  if (loginButton) {

    loginButton.disabled =
      isLoading;

  }


  if (isLoading) {

    if (loginButtonText) {

      loginButtonText.textContent =
        "Signing in...";

    }


    if (loginSpinner) {

      loginSpinner.classList.add(
        "show"
      );

    }

  }

  else {

    if (loginButtonText) {

      loginButtonText.textContent =
        "Sign In";

    }


    if (loginSpinner) {

      loginSpinner.classList.remove(
        "show"
      );

    }

  }

}


// =========================================================
// PASSWORD TOGGLE
// =========================================================

togglePassword?.addEventListener(
  "click",
  () => {

    const hidden =
      passwordInput.type ===
      "password";


    passwordInput.type =
      hidden
        ? "text"
        : "password";


    togglePassword.textContent =
      hidden
        ? "Hide"
        : "Show";


    togglePassword.setAttribute(
      "aria-label",
      hidden
        ? "Hide password"
        : "Show password"
    );

  }
);


// =========================================================
// FORGOT PASSWORD MODAL
// =========================================================

function openPasswordModal() {

  if (!passwordModal) {
    return;
  }


  passwordModal.classList.add(
    "show"
  );


  passwordModal.setAttribute(
    "aria-hidden",
    "false"
  );


  if (resetEmailInput) {

    resetEmailInput.value =
      emailInput?.value
        ?.trim()
        ?.toLowerCase() || "";


    setTimeout(
      () => resetEmailInput.focus(),
      50
    );

  }

}


function closePasswordResetModal() {

  if (!passwordModal) {
    return;
  }


  passwordModal.classList.remove(
    "show"
  );


  passwordModal.setAttribute(
    "aria-hidden",
    "true"
  );


  if (resetPasswordMessage) {

    resetPasswordMessage.textContent =
      "";

    resetPasswordMessage.className =
      "reset-password-message";

  }

}


forgotPasswordButton?.addEventListener(
  "click",
  openPasswordModal
);


closePasswordModal?.addEventListener(
  "click",
  closePasswordResetModal
);


passwordModal?.addEventListener(
  "click",
  event => {

    if (
      event.target ===
      passwordModal
    ) {

      closePasswordResetModal();

    }

  }
);


document.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "Escape" &&
      passwordModal?.classList.contains("show")
    ) {

      closePasswordResetModal();

    }

  }
);


// =========================================================
// RESET PASSWORD MESSAGE
// =========================================================

function showResetMessage(
  message,
  type = "error"
) {

  if (!resetPasswordMessage) {
    return;
  }


  resetPasswordMessage.textContent =
    message;


  resetPasswordMessage.className =
    `reset-password-message show ${type}`;

}


// =========================================================
// RESET PASSWORD
// =========================================================

resetPasswordForm?.addEventListener(
  "submit",
  async event => {

    event.preventDefault();


    if (!resetEmailInput) {
      return;
    }


    const email =
      resetEmailInput.value
        .trim()
        .toLowerCase();


    if (!email) {

      showResetMessage(
        "Please enter your email address.",
        "error"
      );

      return;

    }


    const emailIsValid =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email
      );


    if (!emailIsValid) {

      showResetMessage(
        "Please enter a valid email address.",
        "error"
      );

      return;

    }


    if (resetPasswordButton) {

      resetPasswordButton.disabled =
        true;

      resetPasswordButton.textContent =
        "Sending...";

    }


    try {

      await sendPasswordResetEmail(
        auth,
        email
      );


      showResetMessage(
        "Password reset link sent. Please check your email inbox and follow the instructions.",
        "success"
      );


      resetPasswordForm.reset();


    } catch (error) {

      console.error(
        "Password reset error:",
        error
      );


      let message =
        "Unable to send the password reset email. Please try again.";


      switch (
        error.code
      ) {

        case "auth/invalid-email":

          message =
            "Please enter a valid email address.";

          break;


        case "auth/user-not-found":

          message =
            "No account was found with that email address.";

          break;


        case "auth/user-disabled":

          message =
            "This account has been disabled. Please contact the system administrator.";

          break;


        case "auth/too-many-requests":

          message =
            "Too many reset attempts. Please wait before trying again.";

          break;


        case "auth/network-request-failed":

          message =
            "Network connection failed. Please check your internet connection.";

          break;

      }


      showResetMessage(
        message,
        "error"
      );

    }


    finally {

      if (resetPasswordButton) {

        resetPasswordButton.disabled =
          false;

        resetPasswordButton.textContent =
          "Send Reset Link";

      }

    }

  }
);


// =========================================================
// GET FIRESTORE USER PROFILE
// =========================================================

async function getUserProfile(
  uid
) {

  const userReference =
    doc(
      db,
      "users",
      uid
    );


  const userSnapshot =
    await getDoc(
      userReference
    );


  if (!userSnapshot.exists()) {

    throw new Error(
      "PROFILE_NOT_FOUND"
    );

  }


  return {
    id: userSnapshot.id,
    ...userSnapshot.data()
  };

}


// =========================================================
// NORMALIZE ROLE
// =========================================================

function normalizeRole(
  role
) {

  return String(
    role || ""
  )
    .trim()
    .toLowerCase();

}


// =========================================================
// GET ROLE HOME PAGE
// =========================================================

function getRoleHomePage(
  role
) {

  switch (
    normalizeRole(
      role
    )
  ) {

    case "admin":

      return "dashboard.html";


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

loginForm?.addEventListener(
  "submit",
  async event => {

    event.preventDefault();


    clearMessage();


    const email =
      emailInput.value
        .trim()
        .toLowerCase();


    const password =
      passwordInput.value;


    // =====================================================
    // VALIDATION
    // =====================================================

    if (
      !email ||
      !password
    ) {

      showMessage(
        "Please enter your email address and password."
      );


      return;

    }


    // User intentionally clicked Sign In.

    isLoggingIn =
      true;


    setLoading(
      true
    );


    try {

      // ===================================================
      // FIREBASE AUTHENTICATION
      // ===================================================

      const credential =
        await signInWithEmailAndPassword(
          auth,
          email,
          password
        );


      // ===================================================
      // FIRESTORE PROFILE
      // ===================================================

      const profile =
        await getUserProfile(
          credential.user.uid
        );


      // ===================================================
      // NORMALIZED ROLE
      // ===================================================

      const role =
        normalizeRole(
          profile.role
        );


      // ===================================================
      // ACCOUNT STATUS
      // ===================================================

      const status =
        String(
          profile.status || ""
        )
          .trim()
          .toLowerCase();


      if (
        status !== "active"
      ) {

        await signOut(
          auth
        );


        throw new Error(
          "ACCOUNT_INACTIVE"
        );

      }


      // ===================================================
      // ALLOWED ROLES
      // ===================================================

      const allowedRoles = [
        "admin",
        "staff",
        "client"
      ];


      if (
        !allowedRoles.includes(
          role
        )
      ) {

        await signOut(
          auth
        );


        throw new Error(
          "ROLE_NOT_ALLOWED"
        );

      }


      // ===================================================
      // ROLE-BASED DESTINATION
      // ===================================================

      const destination =
        getRoleHomePage(
          role
        );


      if (!destination) {

        await signOut(
          auth
        );


        throw new Error(
          "ROLE_NOT_ALLOWED"
        );

      }


      // ===================================================
      // LOGIN SUCCESS
      // ===================================================

      let successMessage =
        "Login successful. Redirecting...";


      if (
        role === "client"
      ) {

        successMessage =
          "Client login successful. Opening client portal...";

      }


      showMessage(
        successMessage,
        "success"
      );


      // ===================================================
      // REDIRECT
      // ===================================================

      setTimeout(
        () => {

          window.location.replace(
            destination
          );

        },
        500
      );


    } catch (error) {

      console.error(
        "Login error:",
        error
      );


      // Login attempt ended.

      isLoggingIn =
        false;


      let message =
        "Unable to sign in. Please check your account credentials.";


      // ===================================================
      // FIREBASE AUTH ERRORS
      // ===================================================

      switch (
        error.code
      ) {

        case "auth/invalid-credential":

          message =
            "Incorrect email address or password.";

          break;


        case "auth/invalid-email":

          message =
            "Please enter a valid email address.";

          break;


        case "auth/too-many-requests":

          message =
            "Too many unsuccessful login attempts. Please try again later.";

          break;


        case "auth/network-request-failed":

          message =
            "Network connection failed. Please check your internet connection.";

          break;


        case "auth/user-disabled":

          message =
            "This authentication account has been disabled.";

          break;

      }


      // ===================================================
      // SYSTEM PROFILE ERRORS
      // ===================================================

      if (
        error.message ===
        "PROFILE_NOT_FOUND"
      ) {

        message =
          "Your account exists, but no authorized system profile was found.";


        try {

          await signOut(
            auth
          );

        } catch (_) {}

      }


      if (
        error.message ===
        "ACCOUNT_INACTIVE"
      ) {

        message =
          "This account is currently inactive. Please contact the system administrator.";

      }


      if (
        error.message ===
        "ROLE_NOT_ALLOWED"
      ) {

        message =
          "This account role is not authorized to access the Museo de Lucena system.";

      }


      showMessage(
        message
      );


      setLoading(
        false
      );

    }

  }
);


// =========================================================
// LOGIN PAGE SESSION HANDLING
// =========================================================
//
// The login page does not automatically redirect an old
// remembered Firebase session.
//
// If login.html opens while a previous Firebase session
// still exists, it is cleared first.
//
// The user must intentionally click Sign In.
// =========================================================

onAuthStateChanged(
  auth,
  async user => {

    // Ignore Firebase auth changes caused by
    // the current intentional login attempt.

    if (isLoggingIn) {

      return;

    }


    // Perform initial cleanup once only.

    if (initialSessionChecked) {

      return;

    }


    initialSessionChecked =
      true;


    // Previous session detected.

    if (user) {

      try {

        await signOut(
          auth
        );


        console.log(
          "Previous login session cleared."
        );


      } catch (error) {

        console.error(
          "Unable to clear previous session:",
          error
        );

      }

    }

  }
);