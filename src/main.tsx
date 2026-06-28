import React from 'react'
import ReactDOM from 'react-dom/client'
import { ChakraProvider } from '@chakra-ui/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import { system } from './theme'
import { ThemeSync } from './components/ThemeSync'
import { Toaster } from './components/ui/toaster'
import { loadApiConfig } from './lib/apiBase'
import { syncApiClientBaseUrl } from './api/client'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
})

async function bootstrap() {
  await loadApiConfig()
  syncApiClientBaseUrl()

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
