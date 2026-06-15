import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyCTZFF1QBbNS2AhY2My3FoxE3iMF2VrRso",
  authDomain: "police-bw.firebaseapp.com",
  projectId: "police-bw",
  storageBucket: "police-bw.firebasestorage.app",
  messagingSenderId: "606303723293",
  appId: "1:606303723293:web:2df34f7a461d42d1580bf4",
  measurementId: "G-20HRYJBSP0"
};

// INIT
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

// EXPORT GLOBAL POUR TES AUTRES FICHIERS
window.dbInstance = db;

window.firestoreTools = {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  onSnapshot
};
