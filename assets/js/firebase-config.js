// ===============================================
// MUSEO DE LUCENA
// Firebase Configuration
// ===============================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {getAuth} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {getFirestore} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import {getStorage} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js";

// ===============================================
// Firebase Project Configuration
// ===============================================

const firebaseConfig = {
  apiKey: "AIzaSyCx6XNTmVuCMhgaRGTlS2-5vPjPvT1K2KQ",
  authDomain: "museo-de-lucena-system.firebaseapp.com",
  projectId: "museo-de-lucena-system",
  storageBucket: "museo-de-lucena-system.firebasestorage.app",
  messagingSenderId: "936962348348",
  appId: "1:936962348348:web:24db9fed0fd2e61a9dfa39",
  measurementId: "G-EB7N5GZMQT"
};


// ===============================================
// Initialize Firebase
// ===============================================

const app = initializeApp(firebaseConfig);


// ===============================================
// Firebase Services
// ===============================================

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);


// ===============================================
// Export Services
// ===============================================

export {
  app,
  auth,
  db,
  storage,
  firebaseConfig
};