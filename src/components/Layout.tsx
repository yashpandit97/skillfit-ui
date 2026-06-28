import { useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { Box, Flex, Text, Menu, Portal, IconButton } from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HiBriefcase,
  HiUser,
  HiSun,
  HiMoon,
} from 'react-icons/hi'
import { signOut } from 'firebase/auth'
import { useAuthStore } from '../store/authStore'
import { useThemeStore } from '../store/themeStore'
import { firebaseAuth } from '../lib/firebase'
import { AppFooter } from './ui/AppFooter'
import { ConfirmDialog } from './ui/ConfirmDialog'

const navItems = [
  { to: '/job', label: 'Job Input', icon: HiBriefcase },
]

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation()
  return (
    <>
      {navItems.map(({ to, label, icon: Icon }) => {
        const active = location.pathname === to || (to !== '/job' && location.pathname.startsWith(to))
        return (
          <NavLink key={to} to={to} onClick={onNavigate} style={{ textDecoration: 'none' }}>
            <Flex
              align="center"
              gap={2}
              px={3}
              py={2}
              borderRadius="md"
              fontSize="sm"
              fontWeight="500"
              color={active ? 'white' : 'fg.muted'}
              bg={active ? 'accent.default' : 'transparent'}
              _hover={{ bg: active ? 'accent.default' : 'bg.elevated', color: active ? 'white' : 'fg.default' }}
              transition="all 0.2s"
            >
              <Icon size={18} aria-hidden />
              {label}
            </Flex>
          </NavLink>
        )
      })}
    </>
  )
}

export function Layout() {
  const { token, logout } = useAuthStore()
  const { theme, setTheme } = useThemeStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [logoutOpen, setLogoutOpen] = useState(false)

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark')

  const handleLogout = async () => {
    try {
      await signOut(firebaseAuth)
    } catch {
      /* ignore */
    }
    logout()
    navigate('/login')
    setLogoutOpen(false)
  }

  return (
    <Flex direction="column" minH="100vh" bg="bg.canvas">
      {token && (
        <Box
          as="header"
          position="sticky"
          top={0}
          zIndex={100}
          borderBottomWidth="1px"
          borderColor="border.subtle"
          bg="bg.surface"
          backdropFilter="blur(8px)"
          bgColor="rgba(var(--chakra-colors-bg-surface), 0.85)"
          px={{ base: 4, md: 6 }}
          py={3}
        >
          <Flex align="center" gap={4} maxW="1280px" mx="auto">
            <Text
              fontWeight="700"
              fontSize="lg"
              letterSpacing="-0.02em"
              color="accent.muted"
              flexShrink={0}
            >
              SkillFit
            </Text>

            <Flex display={{ base: 'none', md: 'flex' }} gap={1} flex={1}>
              <NavLinks />
            </Flex>

            <Flex ml="auto" align="center" gap={2}>
              <IconButton aria-label="Toggle theme" variant="ghost" size="sm" onClick={toggleTheme}>
                {theme === 'dark' ? <HiSun /> : <HiMoon />}
              </IconButton>

              <Menu.Root>
                <Menu.Trigger asChild>
                  <IconButton aria-label="User menu" variant="outline" size="sm" borderRadius="full">
                    <HiUser />
                  </IconButton>
                </Menu.Trigger>
                <Portal>
                  <Menu.Positioner>
                    <Menu.Content bg="bg.surface" borderRadius="md" shadow="lg" minW="160px">
                      <Menu.Item value="logout" onClick={() => setLogoutOpen(true)}>
                        Logout
                      </Menu.Item>
                    </Menu.Content>
                  </Menu.Positioner>
                </Portal>
              </Menu.Root>
            </Flex>
          </Flex>
        </Box>
      )}

      <Box as="main" flex={1} px={{ base: 4, md: 8 }} py={6} maxW="1280px" mx="auto" w="full">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </Box>

      {token && (
        <Box maxW="1280px" mx="auto" w="full" px={{ base: 4, md: 8 }}>
          <AppFooter />
        </Box>
      )}

      <ConfirmDialog
        open={logoutOpen}
        title="Log out?"
        description="You will need to sign in again to access your jobs and resumes."
        confirmLabel="Log out"
        destructive
        onConfirm={handleLogout}
        onCancel={() => setLogoutOpen(false)}
      />
    </Flex>
  )
}
