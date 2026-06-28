import { Badge as ChakraBadge } from '@chakra-ui/react'
import { HiSparkles } from 'react-icons/hi'

export function AiBadge() {
  return (
    <ChakraBadge
      variant="subtle"
      colorPalette="purple"
      borderRadius="md"
      px={2}
      py={0.5}
      fontSize="xs"
      display="inline-flex"
      alignItems="center"
      gap={1}
    >
      <HiSparkles aria-hidden />
      AI generated
    </ChakraBadge>
  )
}
