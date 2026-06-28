import {
  Toaster as ChakraToaster,
  Portal,
  Spinner,
  Stack,
  Toast,
  createToaster,
} from '@chakra-ui/react'

export const toaster = createToaster({
  placement: 'top-end',
  pauseOnPageIdle: true,
})

export function Toaster() {
  return (
    <Portal>
      <ChakraToaster toaster={toaster} insetInline={{ mdDown: '4' }}>
        {(toast) => (
          <Toast.Root width={{ md: 'sm' }} bg="bg.surface" borderRadius="md" shadow="lg">
            <Stack gap="1" flex="1" maxWidth="100%">
              {toast.type === 'loading' ? (
                <Spinner size="sm" color="accent.default" />
              ) : (
                <Toast.Title fontWeight="600">{toast.title}</Toast.Title>
              )}
              {toast.description && (
                <Toast.Description color="fg.muted" fontSize="sm">
                  {toast.description}
                </Toast.Description>
              )}
            </Stack>
            {toast.action && <Toast.ActionTrigger>{toast.action.label}</Toast.ActionTrigger>}
            <Toast.CloseTrigger />
          </Toast.Root>
        )}
      </ChakraToaster>
    </Portal>
  )
}
