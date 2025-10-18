// Import the functions you need from the SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-storage.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCCIRk9Vip1J5Zc8xAeObsU6poc-J8lcj0",
  authDomain: "cannabia-9dfe3.firebaseapp.com",
  projectId: "cannabia-9dfe3",
  storageBucket: "cannabia-9dfe3.firebasestorage.app",
  messagingSenderId: "605207982385",
  appId: "1:605207982385:web:58254637495b2b6d2bc010",
  measurementId: "G-6M1WRYG1PS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export the services you need
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;