import { Box, Input, Textarea, type InputProps, type TextareaProps } from '@chakra-ui/react'
import type { ReactNode } from 'react'

interface BaseProps {
  label: ReactNode
  error?: string
  id?: string
}

export function FormField({ label, error, id, children }: BaseProps & { children: ReactNode }) {
  return (
    <Box mb={5}>
      <Box
        as="label"
        {...(id ? { htmlFor: id } : {})}
        display="flex"
        alignItems="center"
        gap={2}
        fontSize="sm"
        fontWeight="500"
        color="fg.default"
        mb={2}
        cursor="pointer"
      >
        {label}
      </Box>
      {children}
      {error && (
        <Box fontSize="xs" color="red.400" mt={1}>
          {error}
        </Box>
      )}
    </Box>
  )
}

const fieldStyles = {
  bg: 'bg.input',
  color: 'fg.default',
  borderWidth: '1px',
  borderColor: 'border.subtle',
  borderRadius: 'md',
  fontSize: 'md',
  _placeholder: { color: 'fg.subtle' },
  _hover: { borderColor: 'border.default' },
  _focusVisible: {
    borderColor: 'accent.muted',
    boxShadow: '0 0 0 3px rgba(92, 184, 230, 0.18)',
    outline: 'none',
  },
}

export function FormInput(props: InputProps) {
  return <Input {...fieldStyles} {...props} />
}

export function FormTextarea(props: TextareaProps) {
  return <Textarea minH="120px" {...fieldStyles} {...props} />
}
