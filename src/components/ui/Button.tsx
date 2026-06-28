import { Button as ChakraButton, type ButtonProps as ChakraButtonProps, Spinner } from '@chakra-ui/react'
import type { ReactNode } from 'react'

export type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'success' | 'danger'

export interface ButtonProps extends Omit<ChakraButtonProps, 'variant'> {
  variant?: ButtonVariant
  loading?: boolean
  icon?: ReactNode
}

const variantMap: Record<ButtonVariant, ChakraButtonProps> = {
  primary: {
    bg: 'accent.default',
    color: 'white',
    _hover: { bg: 'brand.cyan.soft', transform: 'translateY(-1px)' },
  },
  outline: {
    variant: 'outline',
    borderColor: 'border.default',
    color: 'fg.default',
    bg: 'transparent',
    _hover: { bg: 'bg.elevated', borderColor: 'accent.muted' },
  },
  ghost: {
    variant: 'ghost',
    color: 'fg.muted',
    _hover: { bg: 'bg.elevated', color: 'fg.default' },
  },
  success: {
    colorPalette: 'green',
    variant: 'solid',
  },
  danger: {
    colorPalette: 'red',
    variant: 'solid',
  },
}

export function Button({ variant = 'primary', loading, icon, children, disabled, ...rest }: ButtonProps) {
  const styles = variantMap[variant]
  return (
    <ChakraButton
      size="sm"
      borderRadius="md"
      fontWeight="500"
      _active={{ transform: 'scale(0.98)' }}
      transition="all 0.2s ease"
      disabled={disabled || loading}
      {...styles}
      {...rest}
    >
      {loading ? <Spinner size="sm" mr={children ? 2 : 0} /> : icon}
      {children}
    </ChakraButton>
  )
}
