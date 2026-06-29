import { initializeApp } from 'firebase/app'
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  type UserCredential,
} from 'firebase/auth'

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

let redirectResultPromise: Promise<UserCredential | null> | null = null

/**
 * Prefer popup (works reliably on workers.dev). Fall back to redirect if the popup is blocked.
 * Returns null when a redirect was started (page will navigate away).
 */
export async function signInWithGoogle(): Promise<UserCredential | null> {
  try {
    return await signInWithPopup(firebaseAuth, googleProvider)
  } catch (err) {
    const code = (err as { code?: string }).code
    if (code === 'auth/popup-blocked') {
      redirectResultPromise = null
      await signInWithRedirect(firebaseAuth, googleProvider)
      return null
    }
    throw err
  }
}

/** Call once after returning from signInWithRedirect. Must await authStateReady first. */
export async function completeGoogleRedirect(): Promise<UserCredential | null> {
  await firebaseAuth.authStateReady()
  if (!redirectResultPromise) {
    redirectResultPromise = getRedirectResult(firebaseAuth)
  }
  return redirectResultPromise
}

const FIREBASE_AUTH_ERRORS: Record<string, string> = {
  'auth/unauthorized-domain':
    'This site is not authorized in Firebase. Add your URL under Authentication → Settings → Authorized domains.',
  'auth/operation-not-allowed': 'Google sign-in is not enabled in Firebase Authentication.',
  'auth/popup-closed-by-user': 'Sign-in was cancelled.',
  'auth/popup-blocked': 'Popup was blocked. Allow popups for this site or try again.',
  'auth/account-exists-with-different-credential':
    'An account already exists with this email using a different sign-in method.',
}

export function formatFirebaseAuthError(err: unknown): string {
  const code = (err as { code?: string })?.code
  if (code && FIREBASE_AUTH_ERRORS[code]) return FIREBASE_AUTH_ERRORS[code]
  if (err instanceof Error) return err.message
  return 'Google sign-in failed'
}
