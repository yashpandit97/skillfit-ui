import type { ReactNode } from 'react'
import { Box, Text } from '@chakra-ui/react'

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <Box textAlign="center" py={12} px={6}>
      {icon && (
        <Box fontSize="3xl" color="fg.muted" mb={4} display="flex" justifyContent="center">
          {icon}
        </Box>
      )}
      <Text fontWeight="600" fontSize="lg" mb={2}>
        {title}
      </Text>
      {description && (
        <Text color="fg.muted" fontSize="sm" mb={6} maxW="md" mx="auto">
          {description}
        </Text>
      )}
      {action}
    </Box>
  )
}
