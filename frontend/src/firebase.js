import { initializeApp } from "firebase/app"
import { getAuth, GoogleAuthProvider } from "firebase/auth"

const firebaseConfig = {
  apiKey: "AIzaSyCRq6hIHknNSmQC0e-I0rFW0DjvFTBoOOQ",
  authDomain: "videorag-852c2.firebaseapp.com",
  projectId: "videorag-852c2",
  storageBucket: "videorag-852c2.firebasestorage.app",
  messagingSenderId: "208949760983",
  appId: "1:208949760983:web:2004ac1e5905f56cc17192",
  measurementId: "G-CS99BGCBMG"
};

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()