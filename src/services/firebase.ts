import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Public web config for the hacknc2026-d2fec project (not secret; access is controlled by
// Firebase Auth and Firestore security rules).
const firebaseConfig = {
  apiKey: "AIzaSyACpTQfnPzrpMjjapxisIqrtVtq604UXtA",
  authDomain: "hacknc2026-d2fec.firebaseapp.com",
  projectId: "hacknc2026-d2fec",
  storageBucket: "hacknc2026-d2fec.firebasestorage.app",
  messagingSenderId: "476843244853",
  appId: "1:476843244853:web:445bc8c0ea94fce250207c",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);