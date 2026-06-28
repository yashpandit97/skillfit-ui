import { Box, type BoxProps } from '@chakra-ui/react'

export interface CardProps extends BoxProps {
  hover?: boolean
  padding?: BoxProps['p']
}

export function Card({ hover, padding = 5, children, ...rest }: CardProps) {
  return (
    <Box
      bg="bg.surface"
      borderWidth="1px"
      borderColor="border.subtle"
      borderRadius="lg"
      p={padding}
      shadow="sm"
      transition="border-color 0.2s ease, box-shadow 0.2s ease"
      _hover={hover ? { shadow: 'md', borderColor: 'border.default', transform: 'translateY(-1px)' } : undefined}
      {...rest}
    >
      {children}
    </Box>
  )
}
