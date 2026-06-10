// Firebase web config + initialization (ES module).
// NOTE: These values are SAFE to expose in the browser. They identify the
// project; actual access is controlled by Firebase Auth + Firestore Security
// Rules. The service account private key is NOT here and must never be.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyDD3FYDDbJ6COQbB-y1uj88BUwnGwFTjy0",
  authDomain: "hinovaapex.firebaseapp.com",
  projectId: "hinovaapex",
  storageBucket: "hinovaapex.firebasestorage.app",
  messagingSenderId: "63355629880",
  appId: "1:63355629880:web:9ffbf16f77ca232cb211cd",
  measurementId: "G-JJ886Q8NTR"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
