// =========================================================
// MUSEO DE LUCENA
// CLIENT REGISTRATION
// assets/js/client-register.js
// =========================================================

import {
  auth,
  db
} from "./firebase-config.js";


import {
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  signOut,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";


import {
  doc,
  serverTimestamp,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";


// =========================================================
// STATE
// =========================================================

let isRegistering = false;

let initialSessionChecked = false;


// =========================================================
// ELEMENTS
// =========================================================

const clientRegisterForm =
  document.getElementById(
    "clientRegisterForm"
  );


const fullNameInput =
  document.getElementById(
    "fullName"
  );


const emailInput =
  document.getElementById(
    "email"
  );


const contactNumberInput =
  document.getElementById(
    "contactNumber"
  );


const addressInput =
  document.getElementById(
    "address"
  );


const passwordInput =
  document.getElementById(
    "password"
  );


const confirmPasswordInput =
  document.getElementById(
    "confirmPassword"
  );


const togglePassword =
  document.getElementById(
    "togglePassword"
  );


const toggleConfirmPassword =
  document.getElementById(
    "toggleConfirmPassword"
  );


const registerButton =
  document.getElementById(
    "registerButton"
  );


const registerButtonText =
  document.getElementById(
    "registerButtonText"
  );


const registerSpinner =
  document.getElementById(
    "registerSpinner"
  );


const registerMessage =
  document.getElementById(
    "registerMessage"
  );


// =========================================================
// SHOW MESSAGE
// =========================================================

function showMessage(
  message,
  type = "error"
) {

  if (!registerMessage) {

    return;

  }


  registerMessage.textContent =
    message;


  registerMessage.className =
    `register-message show ${type}`;

}


// =========================================================
// CLEAR MESSAGE
// =========================================================

function clearMessage() {

  if (!registerMessage) {

    return;

  }


  registerMessage.textContent =
    "";


  registerMessage.className =
    "register-message";

}


// =========================================================
// LOADING STATE
// =========================================================

function setLoading(
  loading
) {

  if (registerButton) {

    registerButton.disabled =
      loading;

  }


  if (fullNameInput) {

    fullNameInput.disabled =
      loading;

  }


  if (emailInput) {

    emailInput.disabled =
      loading;

  }


  if (contactNumberInput) {

    contactNumberInput.disabled =
      loading;

  }


  if (addressInput) {

    addressInput.disabled =
      loading;

  }


  if (passwordInput) {

    passwordInput.disabled =
      loading;

  }


  if (confirmPasswordInput) {

    confirmPasswordInput.disabled =
      loading;

  }


  if (loading) {

    if (registerButtonText) {

      registerButtonText.textContent =
        "Creating account...";

    }


    if (registerSpinner) {

      registerSpinner.classList.add(
        "show"
      );

    }

  } else {

    if (registerButtonText) {

      registerButtonText.textContent =
        "Create Client Account";

    }


    if (registerSpinner) {

      registerSpinner.classList.remove(
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

    if (!passwordInput) {

      return;

    }


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
// CONFIRM PASSWORD TOGGLE
// =========================================================

toggleConfirmPassword?.addEventListener(
  "click",
  () => {

    if (!confirmPasswordInput) {

      return;

    }


    const hidden =
      confirmPasswordInput.type ===
      "password";


    confirmPasswordInput.type =
      hidden
        ? "text"
        : "password";


    toggleConfirmPassword.textContent =
      hidden
        ? "Hide"
        : "Show";


    toggleConfirmPassword.setAttribute(
      "aria-label",
      hidden
        ? "Hide confirm password"
        : "Show confirm password"
    );

  }
);


// =========================================================
// NORMALIZE PHONE
// =========================================================

function normalizeContactNumber(
  value
) {

  return String(
    value || ""
  )
    .trim()
    .replace(
      /\s+/g,
      " "
    );

}


// =========================================================
// EMAIL VALIDATION
// =========================================================

function isValidEmail(
  email
) {

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email
  );

}


// =========================================================
// FORM VALIDATION
// =========================================================

function validateForm() {

  const fullName =
    fullNameInput.value
      .trim();


  const email =
    emailInput.value
      .trim()
      .toLowerCase();


  const password =
    passwordInput.value;


  const confirmPassword =
    confirmPasswordInput.value;


  if (!fullName) {

    return {
      valid: false,
      message:
        "Please enter your full name."
    };

  }


  if (
    fullName.length < 2
  ) {

    return {
      valid: false,
      message:
        "Please enter a valid full name."
    };

  }


  if (!email) {

    return {
      valid: false,
      message:
        "Please enter your email address."
    };

  }


  if (
    !isValidEmail(
      email
    )
  ) {

    return {
      valid: false,
      message:
        "Please enter a valid email address."
    };

  }


  if (!password) {

    return {
      valid: false,
      message:
        "Please create a password."
    };

  }


  if (
    password.length < 8
  ) {

    return {
      valid: false,
      message:
        "Password must contain at least 8 characters."
    };

  }


  if (!confirmPassword) {

    return {
      valid: false,
      message:
        "Please confirm your password."
    };

  }


  if (
    password !==
    confirmPassword
  ) {

    return {
      valid: false,
      message:
        "Passwords do not match."
    };

  }


  return {
    valid: true
  };

}


// =========================================================
// CLIENT REGISTRATION
// =========================================================

clientRegisterForm?.addEventListener(
  "submit",
  async event => {

    event.preventDefault();


    clearMessage();


    // =====================================================
    // VALIDATE
    // =====================================================

    const validation =
      validateForm();


    if (
      !validation.valid
    ) {

      showMessage(
        validation.message,
        "error"
      );


      return;

    }


    const fullName =
      fullNameInput.value
        .trim();


    const email =
      emailInput.value
        .trim()
        .toLowerCase();


    const contactNumber =
      normalizeContactNumber(
        contactNumberInput.value
      );


    const address =
      addressInput.value
        .trim();


    const password =
      passwordInput.value;


    // =====================================================
    // START REGISTRATION
    // =====================================================

    isRegistering =
      true;


    setLoading(
      true
    );


    let createdUser =
      null;


    try {

      // ===================================================
      // CREATE FIREBASE AUTH ACCOUNT
      // ===================================================

      const credential =
        await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );


      createdUser =
        credential.user;


      // ===================================================
      // UPDATE FIREBASE DISPLAY NAME
      // ===================================================

      try {

        await updateProfile(
          createdUser,
          {
            displayName:
              fullName
          }
        );


      } catch (
        profileError
      ) {

        console.warn(
          "Unable to set Firebase display name:",
          profileError
        );

      }


      // ===================================================
      // CREATE FIRESTORE CLIENT PROFILE
      // ===================================================

      await setDoc(
        doc(
          db,
          "users",
          createdUser.uid
        ),
        {

          fullName:
            fullName,

          email:
            email,

          contactNumber:
            contactNumber,

          address:
            address,

          // IMPORTANT:
          // Public registration can ONLY
          // create a Client account.

          role:
            "client",

          status:
            "active",

          createdAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp(),

          registrationSource:
            "client-registration"

        }
      );


      // ===================================================
      // REGISTRATION SUCCESS
      // ===================================================

      showMessage(
        "Account created successfully. You can now sign in to the Client Portal.",
        "success"
      );


      clientRegisterForm.reset();


      // Return password buttons to default state.

      if (passwordInput) {

        passwordInput.type =
          "password";

      }


      if (confirmPasswordInput) {

        confirmPasswordInput.type =
          "password";

      }


      if (togglePassword) {

        togglePassword.textContent =
          "Show";


        togglePassword.setAttribute(
          "aria-label",
          "Show password"
        );

      }


      if (toggleConfirmPassword) {

        toggleConfirmPassword.textContent =
          "Show";


        toggleConfirmPassword.setAttribute(
          "aria-label",
          "Show confirm password"
        );

      }


      // ===================================================
      // SIGN OUT AFTER REGISTRATION
      // ===================================================
      //
      // createUserWithEmailAndPassword automatically signs
      // the new account in.
      //
      // We sign it out so the user intentionally logs in
      // through login.html.
      // ===================================================

      await signOut(
        auth
      );


      isRegistering =
        false;


      setTimeout(
        () => {

          window.location.replace(
            "login.html"
          );

        },
        1600
      );


    } catch (error) {

      console.error(
        "CLIENT REGISTRATION ERROR:",
        error
      );


      // ===================================================
      // ROLLBACK AUTH ACCOUNT
      // ===================================================
      //
      // If Authentication account was created but
      // Firestore profile creation failed, remove the
      // Authentication account again.
      // ===================================================

      if (
        createdUser &&
        auth.currentUser?.uid ===
          createdUser.uid
      ) {

        try {

          await deleteUser(
            createdUser
          );


          console.log(
            "Incomplete client account rolled back."
          );


        } catch (
          rollbackError
        ) {

          console.error(
            "Unable to rollback incomplete account:",
            rollbackError
          );

        }

      }


      isRegistering =
        false;


      let message =
        "Unable to create your client account. Please try again.";


      // ===================================================
      // FIREBASE AUTH ERRORS
      // ===================================================

      switch (
        error.code
      ) {

        case "auth/email-already-in-use":

          message =
            "This email address is already registered. Please sign in instead.";

          break;


        case "auth/invalid-email":

          message =
            "Please enter a valid email address.";

          break;


        case "auth/weak-password":

          message =
            "Your password is too weak. Please use at least 8 characters.";

          break;


        case "auth/operation-not-allowed":

          message =
            "Client registration is currently unavailable. Email/Password authentication is not enabled.";

          break;


        case "auth/network-request-failed":

          message =
            "Network connection failed. Please check your internet connection.";

          break;


        case "auth/too-many-requests":

          message =
            "Too many registration attempts. Please wait before trying again.";

          break;


        case "permission-denied":

          message =
            "Your account could not be completed because Firestore denied the client profile creation.";

          break;

      }


      // Firestore errors sometimes use this form.

      if (
        error.code ===
        "permission-denied" ||
        error.code ===
        "firestore/permission-denied"
      ) {

        message =
          "Client profile creation is currently blocked by the Firestore security rules.";

      }


      showMessage(
        message,
        "error"
      );


      setLoading(
        false
      );

    }

  }
);


// =========================================================
// EXISTING SESSION HANDLING
// =========================================================
//
// Registration page should start without an old logged-in
// Admin, Staff, or Client session.
//
// Do NOT sign out while an actual registration is happening.
// =========================================================

onAuthStateChanged(
  auth,
  async user => {

    if (
      isRegistering
    ) {

      return;

    }


    if (
      initialSessionChecked
    ) {

      return;

    }


    initialSessionChecked =
      true;


    if (user) {

      try {

        await signOut(
          auth
        );


        console.log(
          "Previous session cleared before client registration."
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