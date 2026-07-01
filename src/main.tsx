import React from 'react'
import ReactDOM from 'react-dom/client'
import { ChakraProvider } from '@chakra-ui/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import { system } from './theme'
import { ThemeSync } from './components/ThemeSync'
import { Toaster } from './components/ui/toaster'
import { AuthBootstrap } from './components/AuthBootstrap'
import './index.css'

// Capture Firebase redirect result as early as possible.
import './lib/firebase'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ChakraProvider value={system}>
      <QueryClientProvider client={queryClient}>
        <ThemeSync />
        <AuthBootstrap>
          <App />
        </AuthBootstrap>
        <Toaster />
      </QueryClientProvider>
    </ChakraProvider>
  </React.StrictMode>,
)
