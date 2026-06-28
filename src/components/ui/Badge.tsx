import { Badge as ChakraBadge, type BadgeProps } from '@chakra-ui/react'

export type BadgeTone = 'default' | 'success' | 'warning' | 'danger' | 'info'

const toneMap: Record<BadgeTone, BadgeProps> = {
  default: { colorPalette: 'gray' },
  success: { colorPalette: 'green' },
  warning: { colorPalette: 'yellow' },
  danger: { colorPalette: 'red' },
  info: { colorPalette: 'blue' },
}

export function Badge({ tone = 'default', children, ...rest }: BadgeProps & { tone?: BadgeTone }) {
  return (
    <ChakraBadge variant="subtle" borderRadius="md" px={2} py={0.5} fontSize="xs" textTransform="capitalize" {...toneMap[tone]} {...rest}>
      {children}
    </ChakraBadge>
  )
}

/** Map job/gap status strings to badge tones. */
export function statusTone(status: string): BadgeTone {
  const s = status.toLowerCase()
  if (s.includes('complete') || s.includes('low') || s.includes('strong') || s.includes('fit_report_ready')) return 'success'
  if (s.includes('medium') || s.includes('partial') || s.includes('progress')) return 'warning'
  if (s.includes('high') || s.includes('gap') || s.includes('fail')) return 'danger'
  return 'info'
}
