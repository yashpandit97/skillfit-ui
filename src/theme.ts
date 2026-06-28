import { createSystem, defaultConfig } from '@chakra-ui/react'

/** Blue gradient palette — softened for comfortable dark UI */
const PALETTE = {
  cyan: '#00BFFF',
  azure: '#0099CC',
  ocean: '#006699',
  navy: '#00334D',
  midnight: '#001A26',
} as const

export const system = createSystem(defaultConfig, {
  globalCss: {
    html: {
      colorScheme: 'dark',
    },
    'html.light': {
      colorScheme: 'light',
    },
    body: {
      bg: 'bg.canvas',
      color: 'fg.default',
      fontFamily: 'body',
      lineHeight: '1.6',
    },
    '#root': {
      minH: '100vh',
    },
    '::placeholder': {
      color: 'var(--chakra-colors-fg-subtle)',
      opacity: 1,
    },
  },
  theme: {
    tokens: {
      fonts: {
        body: { value: "'IBM Plex Sans', system-ui, sans-serif" },
        heading: { value: "'IBM Plex Sans', system-ui, sans-serif" },
      },
      radii: {
        sm: { value: '4px' },
        md: { value: '6px' },
        lg: { value: '8px' },
        xl: { value: '12px' },
      },
      fontSizes: {
        xs: { value: '0.75rem' },
        sm: { value: '0.875rem' },
        md: { value: '0.9375rem' },
        lg: { value: '1.125rem' },
        xl: { value: '1.25rem' },
        '2xl': { value: '1.5rem' },
        '3xl': { value: '1.875rem' },
      },
      spacing: {
        '1': { value: '4px' },
        '2': { value: '8px' },
        '3': { value: '12px' },
        '4': { value: '16px' },
        '5': { value: '20px' },
        '6': { value: '24px' },
        '8': { value: '32px' },
        '10': { value: '40px' },
        '12': { value: '48px' },
      },
      colors: {
        brand: {
          cyan: { value: PALETTE.cyan },
          'cyan.soft': { value: '#5CB8E6' },
          azure: { value: PALETTE.azure },
          'azure.dark': { value: '#007AA3' },
          ocean: { value: PALETTE.ocean },
          navy: { value: PALETTE.navy },
          midnight: { value: PALETTE.midnight },
        },
        green: {
          400: { value: '#4ade80' },
          500: { value: '#22c55e' },
        },
        yellow: {
          400: { value: '#facc15' },
          500: { value: '#eab308' },
        },
        red: {
          400: { value: '#f87171' },
          500: { value: '#ef4444' },
        },
      },
    },
    semanticTokens: {
      colors: {
        'bg.canvas': {
          value: { _light: '#EEF6FA', _dark: '{colors.brand.midnight}' },
        },
        'bg.surface': {
          value: { _light: '#FFFFFF', _dark: '#002433' },
        },
        'bg.elevated': {
          value: { _light: '#E2F0F7', _dark: '#003248' },
        },
        'bg.subtle': {
          value: { _light: '#F5FAFD', _dark: '#002A3A' },
        },
        'bg.input': {
          value: { _light: '#FFFFFF', _dark: '#003650' },
        },
        'fg.default': {
          value: { _light: '{colors.brand.midnight}', _dark: '#F0F7FB' },
        },
        'fg.muted': {
          value: { _light: '#4A7080', _dark: '#A8C4D4' },
        },
        'fg.subtle': {
          value: { _light: '#7A9AAD', _dark: '#6E8FA3' },
        },
        'border.default': {
          value: { _light: '#C5DDE8', _dark: '#004D66' },
        },
        'border.subtle': {
          value: { _light: '#DCEAF2', _dark: '#003850' },
        },
        'accent.default': {
          value: { _light: '{colors.brand.azure}', _dark: '{colors.brand.azure}' },
        },
        'accent.muted': {
          value: { _light: '{colors.brand.cyan.soft}', _dark: '{colors.brand.cyan.soft}' },
        },
        'accent.teal': {
          value: { _light: '{colors.brand.azure}', _dark: '{colors.brand.azure}' },
        },
        'paper.bg': {
          value: '#FFFFFF',
        },
      },
    },
  },
})
