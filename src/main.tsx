import React from 'react'
import ReactDOM from 'react-dom/client'
import { ChakraProvider } from '@chakra-ui/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import { system } from './theme'
import { ThemeSync } from './components/ThemeSync'
import { Toaster } from './components/ui/toaster'
import { loadApiConfig, validateApiReachable } from './lib/apiBase'
import { authApi, syncApiClientBaseUrl } from './api/client'
import { getGoogleRedirectResult, firebaseAuth, formatFirebaseAuthError } from './lib/firebase'
import { formatAuthError } from './lib/authErrors'
import { setAuthBootError, useAuthStore, waitForAuthHydration } from './store/authStore'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
})

async function bootstrap() {
  await loadApiConfig()
  syncApiClientBaseUrl()
  await waitForAuthHydration()

  try {
    const result = await getGoogleRedirectResult()
    const user = result?.user ?? firebaseAuth.currentUser
    if (!user) return

    const idToken = await user.getIdToken(true)
    if (!idToken) throw new Error('Could not get Firebase session')

    const { data } = await authApi.firebaseLogin(idToken)
    useAuthStore.getState().setToken(data.access_token)
  } catch (err) {
    setAuthBootError(formatFirebaseAuthError(err) || formatAuthError(err))
  }

  const apiError = await validateApiReachable()
  if (apiError && !useAuthStore.getState().token) {
    setAuthBootError(apiError)
  }

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <ChakraProvider value={system}>
        <QueryClientProvider client={queryClient}>
          <ThemeSync />
          <App />
          <Toaster />
        </QueryClientProvider>
      </ChakraProvider>
    </React.StrictMode>,
  )
}

bootstrap()
