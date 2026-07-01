import { initializeApp } from 'firebase/app'
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged,
  type User,
  type UserCredential,
} from 'firebase/auth'
import { useAuthStore } from '../store/authStore'

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

// Must run as soon as this module loads — before any other async work.
const redirectResultPromise = getRedirectResult(firebaseAuth)

function waitForFirebaseUser(timeoutMs = 5000): Promise<User | null> {
  if (firebaseAuth.currentUser) return Promise.resolve(firebaseAuth.currentUser)

  return new Promise((resolve) => {
    let unsub: (() => void) | undefined

    const timer = window.setTimeout(() => {
      unsub?.()
      resolve(firebaseAuth.currentUser)
    }, timeoutMs)

    unsub = onAuthStateChanged(firebaseAuth, (user) => {
      if (user) {
        window.clearTimeout(timer)
        unsub?.()
        resolve(user)
      }
    })
  })
}

function mayBeReturningFromOAuth(): boolean {
  const ref = document.referrer
  return ref.includes('accounts.google.com') || ref.includes('firebaseapp.com')
}

export function getGoogleRedirectResult(): Promise<UserCredential | null> {
  return redirectResultPromise.then(async (result) => {
    if (result?.user) return result

    await firebaseAuth.authStateReady()
    if (firebaseAuth.currentUser) {
      return { user: firebaseAuth.currentUser } as UserCredential
    }

    // Static hosts (e.g. workers.dev) can finish auth slightly after getRedirectResult.
    if (mayBeReturningFromOAuth()) {
      const user = await waitForFirebaseUser(5000)
      if (user) return { user } as UserCredential
    }

    return null
  })
}

/** Popup first (works on localhost and workers.dev). Redirect only if popup is blocked. */
export async function signInWithGoogle(): Promise<UserCredential | null> {
  try {
    return await signInWithPopup(firebaseAuth, googleProvider)
  } catch (err) {
    const code = (err as { code?: string }).code
    if (code === 'auth/popup-closed-by-user') throw err
    if (code === 'auth/popup-blocked' || code === 'auth/cancelled-popup-request') {
      useAuthStore.getState().setToken(null)
      await signInWithRedirect(firebaseAuth, googleProvider)
      return null
    }
    throw err
  }
}

/** @deprecated Use getGoogleRedirectResult() */
export async function completeGoogleRedirect(): Promise<UserCredential | null> {
  return getGoogleRedirectResult()
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
