import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Konfigurasi Firebase Anda, dengan API Key diambil dari environment variables
const firebaseConfig = {
  apiKey: process.env.API_KEY, // KUNCI DIAMBIL DARI TEMPAT AMAN
  authDomain: "projectdakota-9e0cc.firebaseapp.com",
  databaseURL: "https://projectdakota-9e0cc-default-rtdb.firebaseio.com",
  projectId: "projectdakota-9e0cc",
  storageBucket: "projectdakota-9e0cc.firebasestorage.app",
  messagingSenderId: "623275029335",
  appId: "1:623275029335:web:9caed78ba96f30d1bc8412",
  measurementId: "G-L83D2RTJW9"
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth, app };
