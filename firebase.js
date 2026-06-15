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

const firebaseConfig = {
    apiKey: "TON_API_KEY",
    authDomain: "police-bw.firebaseapp.com",
    projectId: "police-bw",
    storageBucket: "police-bw.appspot.com",
    messagingSenderId: "606303723293",
    appId: "1:606303723293:web:2df34f7a461d42d1580bf4"
};

const app =
