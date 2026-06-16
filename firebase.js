import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";

import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  collection,
  onSnapshot,
  addDoc   // 👈 IMPORTANT
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCTZFF1QBbNS2AhY2My3FoxE3iMF2VrRso",
  authDomain: "police-bw.firebaseapp.com",
  projectId: "police-bw",
  storageBucket: "police-bw.appspot.com",
  messagingSenderId: "606303723293",
  appId: "1:606303723293:web:2df34f7a461d42d1580bf4"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export const firestoreDB = db;

// ✅ exports Firestore COMPLETS
export {
  db,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  collection,
  onSnapshot,
  addDoc   // 👈 OBLIGATOIRE
};
