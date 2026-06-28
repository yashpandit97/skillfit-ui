import { Box, Flex, Link, Text } from '@chakra-ui/react'

export function AppFooter() {
  return (
    <Box as="footer" borderTopWidth="1px" borderColor="border.default" py={6} mt="auto">
      <Flex justify="space-between" align="center" flexWrap="wrap" gap={4} fontSize="sm" color="fg.muted">
        <Text>© {new Date().getFullYear()} SkillFit</Text>
        <Flex gap={4}>
          <Link href="#" _hover={{ color: 'fg.default' }}>
            Privacy
          </Link>
          <Link href="#" _hover={{ color: 'fg.default' }}>
            Terms
          </Link>
        </Flex>
      </Flex>
    </Box>
  )
}
