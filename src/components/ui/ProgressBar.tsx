import { Box, Flex, Text } from '@chakra-ui/react'

export interface ProgressBarProps {
  value: number
  label?: string
  stageLabel?: string
}

export function ProgressBar({ value, label, stageLabel }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, value))
  return (
    <Box w="full" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      {stageLabel && (
        <Text fontSize="sm" color="fg.muted" mb={2}>
          {stageLabel}
        </Text>
      )}
      <Flex align="center" gap={3}>
        <Box flex={1} h="8px" bg="bg.elevated" borderRadius="full" overflow="hidden">
          <Box
            h="full"
            w={`${pct}%`}
            bg="accent.muted"
            transition="width 0.3s ease"
          />
        </Box>
        <Text fontSize="sm" fontWeight="600" color="fg.muted" minW="3ch">
          {label ?? `${pct}%`}
        </Text>
      </Flex>
    </Box>
  )
}
