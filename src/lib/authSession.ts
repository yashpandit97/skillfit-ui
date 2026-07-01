import { authApi, syncApiClientBaseUrl } from '../api/client'
import { loadApiConfig, validateApiReachable } from './apiBase'
import { formatAuthError } from './authErrors'
import { firebaseAuth, formatFirebaseAuthError, getGoogleRedirectResult } from './firebase'
import { useAuthStore, waitForAuthHydration } from '../store/authStore'

export type AuthInitResult = {
  error: string | null
  apiWarning: string | null
}

/** Exchange current Firebase user for an app JWT. */
export async function exchangeFirebaseSession(): Promise<void> {
  const idToken = await firebaseAuth.currentUser?.getIdToken(true)
  if (!idToken) throw new Error('Could not get Firebase session')
  const { data } = await authApi.firebaseLogin(idToken)
  useAuthStore.getState().setToken(data.access_token)
}

/** Runs once on app load: config, Google redirect, JWT validation/recovery. */
export async function initializeAuthSession(): Promise<AuthInitResult> {
  await loadApiConfig()
  syncApiClientBaseUrl()
  await waitForAuthHydration()

  let error: string | null = null
  let justExchanged = false

  try {
    const result = await getGoogleRedirectResult()
    const user = result?.user ?? firebaseAuth.currentUser
    if (user) {
      await exchangeFirebaseSession()
      justExchanged = true
    }
  } catch (err) {
    error = formatFirebaseAuthError(err) || formatAuthError(err)
    useAuthStore.getState().setToken(null)
  }

  const token = useAuthStore.getState().token
  if (token && !justExchanged) {
    try {
      await authApi.me()
    } catch {
      useAuthStore.getState().setToken(null)
    }
  }

  if (!useAuthStore.getState().token) {
    await firebaseAuth.authStateReady()
    if (firebaseAuth.currentUser) {
      try {
        await exchangeFirebaseSession()
        error = null
      } catch (err) {
        error = error ?? (formatFirebaseAuthError(err) || formatAuthError(err))
      }
    }
  }

  let apiWarning: string | null = null
  if (!useAuthStore.getState().token) {
    apiWarning = await validateApiReachable()
  }

  return { error, apiWarning }
}
