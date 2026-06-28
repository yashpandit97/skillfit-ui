import { Box, type BoxProps } from '@chakra-ui/react'

export function ResumePaper({ children, ...rest }: BoxProps) {
  return (
    <Box
      bg="paper.bg"
      color="gray.900"
      borderRadius="md"
      p={{ base: 6, md: 10 }}
      shadow="lg"
      maxW="800px"
      mx="auto"
      borderWidth="1px"
      borderColor="gray.200"
      {...rest}
    >
      {children}
    </Box>
  )
}
