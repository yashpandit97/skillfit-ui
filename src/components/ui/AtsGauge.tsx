import { Box, Text } from '@chakra-ui/react'

export function AtsGauge({ score, missingKeywords }: { score: number; missingKeywords?: string[] }) {
  const pct = Math.min(100, Math.max(0, score))
  const circumference = 2 * Math.PI * 42
  const offset = circumference - (pct / 100) * circumference

  return (
    <Box display="flex" alignItems="center" gap={4}>
      <Box position="relative" w="100px" h="100px" flexShrink={0}>
        <svg width="100" height="100" viewBox="0 0 100 100" aria-hidden>
          <circle cx="50" cy="50" r="42" fill="none" stroke="#004D66" strokeWidth="8" opacity={0.45} />
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="#5CB8E6"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 50 50)"
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        <Text position="absolute" top="50%" left="50%" transform="translate(-50%, -50%)" fontWeight="700" fontSize="xl">
          {pct}%
        </Text>
      </Box>
      <Box>
        <Text fontWeight="600" fontSize="sm">
          ATS match score
        </Text>
        {missingKeywords && missingKeywords.length > 0 && (
          <Text fontSize="xs" color="fg.muted" mt={1}>
            Missing: {missingKeywords.slice(0, 3).join(', ')}
            {missingKeywords.length > 3 ? '…' : ''}
          </Text>
        )}
      </Box>
    </Box>
  )
}
