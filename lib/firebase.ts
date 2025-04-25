import { initializeApp, getApps } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { getAuth } from "firebase/auth"
import { getStorage } from "firebase/storage"

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB8yY5v9wEMZ6eMCEflDjSi8zZ7Stgtl8E",
  authDomain: "teamkyrie-cb33e.firebaseapp.com",
  projectId: "teamkyrie-cb33e",
  storageBucket: "teamkyrie-cb33e.appspot.com",
  messagingSenderId: "401654553606",
  appId: "1:401654553606:web:64393390717a0942f43787",
}

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
const db = getFirestore(app)
const auth = getAuth(app)
const storage = getStorage(app)

export { app, db, auth, storage }
