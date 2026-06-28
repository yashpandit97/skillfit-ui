import { Box, Flex, Heading, Text } from '@chakra-ui/react'
import type { ReactNode } from 'react'
import { Breadcrumbs, type Crumb } from '../Breadcrumbs'

export interface PageHeaderProps {
  title: string
  subtitle?: string
  breadcrumbs?: Crumb[]
  actions?: ReactNode
  badge?: ReactNode
}

export function PageHeader({ title, subtitle, breadcrumbs, actions, badge }: PageHeaderProps) {
  return (
    <Box mb={8}>
      {breadcrumbs && breadcrumbs.length > 0 && <Breadcrumbs items={breadcrumbs} />}
      <Flex justify="space-between" align="flex-start" gap={4} flexWrap="wrap" mt={breadcrumbs?.length ? 3 : 0}>
        <Box>
          <Flex align="center" gap={3} mb={1}>
            <Heading size="2xl" letterSpacing="-0.02em">
              {title}
            </Heading>
            {badge}
          </Flex>
          {subtitle && (
            <Text color="fg.muted" fontSize="md" maxW="2xl">
              {subtitle}
            </Text>
          )}
        </Box>
        {actions && (
          <Flex gap={2} flexWrap="wrap" align="center">
            {actions}
          </Flex>
        )}
      </Flex>
    </Box>
  )
}
