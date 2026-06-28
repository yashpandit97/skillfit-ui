import { Link } from 'react-router-dom'
import { Box, Text } from '@chakra-ui/react'

export interface Crumb {
  label: string
  to?: string
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <Box as="nav" aria-label="Breadcrumb" fontSize="sm" color="fg.muted">
      {items.map((item, i) => (
        <Box as="span" key={i}>
          {i > 0 && (
            <Text as="span" mx={2} color="fg.muted">
              /
            </Text>
          )}
          {item.to ? (
            <Link to={item.to} style={{ color: 'inherit' }}>
              <Text as="span" _hover={{ color: 'accent.default' }}>
                {item.label}
              </Text>
            </Link>
          ) : (
            <Text as="span" color="fg.default">
              {item.label}
            </Text>
          )}
        </Box>
      ))}
    </Box>
  )
}
