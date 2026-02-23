import { createSystem, defaultConfig } from '@chakra-ui/react'

/**
 * Chakra UI theme: dark professional look matching the app's existing CSS variables.
 * Extends defaultConfig with app colors and gray scale for components.
 */
export const system = createSystem(defaultConfig, {
  theme: {
    tokens: {
      colors: {
        'bg.base': { value: '#0f172a' },
        'bg.card': { value: '#1e293b' },
        'bg.elevated': { value: '#334155' },
        border: { value: '#334155' },
        'text': { value: '#e2e8f0' },
        'text.muted': { value: '#94a3b8' },
        accent: { value: '#3b82f6' },
        'accent.hover': { value: '#2563eb' },
        success: { value: '#22c55e' },
        danger: { value: '#f87171' },
        // Gray scale so Chakra components (gray.500, gray.800, etc.) render correctly
        'gray.50': { value: '#f8fafc' },
        'gray.100': { value: '#f1f5f9' },
        'gray.200': { value: '#e2e8f0' },
        'gray.300': { value: '#cbd5e1' },
        'gray.400': { value: '#94a3b8' },
        'gray.500': { value: '#64748b' },
        'gray.600': { value: '#475569' },
        'gray.700': { value: '#334155' },
        'gray.800': { value: '#1e293b' },
        'gray.900': { value: '#0f172a' },
        'blue.600': { value: '#2563eb' },
        'green.400': { value: '#4ade80' },
        'green.500': { value: '#22c55e' },
        'orange.400': { value: '#fb923c' },
        'orange.500': { value: '#f97316' },
        'red.400': { value: '#f87171' },
      },
      fonts: {
        body: { value: "'IBM Plex Sans', system-ui, sans-serif" },
        heading: { value: "'IBM Plex Sans', system-ui, sans-serif" },
      },
      radii: {
        lg: { value: '12px' },
        md: { value: '8px' },
      },
    },
    semanticTokens: {
      colors: {
        'bg.canvas': { value: { base: '#0f172a' } },
        'bg.surface': { value: { base: '#1e293b' } },
        'fg.default': { value: { base: '#e2e8f0' } },
        'fg.muted': { value: { base: '#94a3b8' } },
        'border.default': { value: { base: '#334155' } },
        'accent.default': { value: { base: '#3b82f6' } },
        'accent.fg': { value: { base: 'white' } },
      },
    },
  },
})
