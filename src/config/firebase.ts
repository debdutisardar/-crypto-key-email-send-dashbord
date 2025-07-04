import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyBJ55oX-kOIWEX3k_Y5CZlygqrUbk7lO-A",
  authDomain: "cryptokey-78d14.firebaseapp.com",
  projectId: "cryptokey-78d14",
  storageBucket: "cryptokey-78d14.firebasestorage.app",
  messagingSenderId: "210074678590",
  appId: "1:210074678590:web:9699d0a5df569eca2b686f",
  databaseURL: "https://cryptokey-78d14-default-rtdb.firebaseio.com"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);

export default app; 