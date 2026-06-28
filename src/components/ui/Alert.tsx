import { Alert as ChakraAlert } from '@chakra-ui/react'
import type { ReactNode } from 'react'

export function Alert({ status = 'error', title, children }: { status?: 'error' | 'info' | 'success' | 'warning'; title?: string; children: ReactNode }) {
  return (
    <ChakraAlert.Root status={status} borderRadius="md" mb={4}>
      <ChakraAlert.Indicator />
      <ChakraAlert.Content>
        {title && <ChakraAlert.Title>{title}</ChakraAlert.Title>}
        <ChakraAlert.Description>{children}</ChakraAlert.Description>
      </ChakraAlert.Content>
    </ChakraAlert.Root>
  )
}
