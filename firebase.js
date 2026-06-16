import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";

import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  collection,
  onSnapshot,
  addDoc
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

/* =========================
   CONFIG FIREBASE
========================= */

const firebaseConfig = {
  apiKey: "AIzaSyCTZFF1QBbNS2AhY2My3FoxE3iMF2VrRso",
  authDomain: "police-bw.firebaseapp.com",
  projectId: "police-bw",
  storageBucket: "police-bw.appspot.com",
  messagingSenderId: "606303723293",
  appId: "1:606303723293:web:2df34f7a461d42d1580bf4"
};

/* =========================
   INIT APP
========================= */

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

/* =========================
   EXPORT PROPRE (SECURISÉ)
========================= */

export const firestoreDB = db;
export const firebaseAuth = auth;

/* =========================
   AUTH HELPERS (IMPORTANT)
========================= */

export {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
};

/* =========================
   FIRESTORE HELPERS
========================= */

export {
  db,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  collection,
  onSnapshot,
  addDoc
};
