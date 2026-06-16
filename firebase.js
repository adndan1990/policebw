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
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

/* =========================
   CONFIG
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
   INIT
========================= */

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

/* =========================
   ROLE UTILISATEUR
========================= */

let currentUser = null;
let currentRole = null;

/* =========================
   LISTENER LOGIN
========================= */

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    currentUser = null;
    currentRole = null;
    console.log("❌ Non connecté");
    return;
  }

  currentUser = user;

  // 🔐 récupère le rôle admin/user depuis Firebase
  const token = await user.getIdTokenResult();
  currentRole = token.claims.role || "user";

  console.log("✅ connecté :", user.email);
  console.log("🎭 rôle :", currentRole);
});

/* =========================
   CHECK ADMIN SIMPLE
========================= */

export function isAdmin() {
  return currentRole === "admin";
}

/* =========================
   EXPORTS FIRESTORE
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

/* =========================
   EXPORT AUTH
========================= */

export {
  auth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
};
