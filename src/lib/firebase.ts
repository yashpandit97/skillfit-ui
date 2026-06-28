import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? 'AIzaSyBn94u9sXhgbVuLp8pXlkcl5fDiqxJKQ0w',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? 'skillfit-e06fe.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? 'skillfit-e06fe',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? 'skillfit-e06fe.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '828988748105',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '1:828988748105:web:d83bbf6ca4aeea0bedea98',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ?? 'G-6ES09SHTTR',
}

export const firebaseApp = initializeApp(firebaseConfig)
export const firebaseAuth = getAuth(firebaseApp)

const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })

export async function signInWithGoogle() {
  const result = await signInWithPopup(firebaseAuth, googleProvider)
  return result.user
}
