import { useEffect, useState } from 'react'
import { Flex, Spinner } from '@chakra-ui/react'
import { initializeAuthSession } from '../lib/authSession'
import { setAuthBootError } from '../store/authStore'

export function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    void initializeAuthSession().then(({ error, apiWarning }) => {
      const message = error ?? apiWarning
      if (message) setAuthBootError(message)
      setReady(true)
    })
  }, [])

  if (!ready) {
    return (
      <Flex minH="100vh" align="center" justify="center" bg="bg.canvas">
        <Spinner size="lg" color="accent.default" />
      </Flex>
    )
  }

  return <>{children}</>
}
