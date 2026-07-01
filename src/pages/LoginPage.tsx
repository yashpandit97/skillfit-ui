import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Flex, Heading, Text, Link as ChakraLink, Box } from '@chakra-ui/react'
import { HiLockClosed, HiMail, HiLogin } from 'react-icons/hi'
import { FcGoogle } from 'react-icons/fc'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth'
import { authApi } from '../api/client'
import { firebaseAuth, signInWithGoogle, formatFirebaseAuthError } from '../lib/firebase'
import { formatAuthError } from '../lib/authErrors'
import { consumeAuthBootError, useAuthStore, waitForAuthHydration } from '../store/authStore'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { FormField, FormInput } from '../components/ui/FormField'
import { Alert } from '../components/ui/Alert'
import { toaster } from '../lib/toaster'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const token = useAuthStore((s) => s.token)
  const setToken = useAuthStore((s) => s.setToken)
  const navigate = useNavigate()

  useEffect(() => {
    const bootError = consumeAuthBootError()
    if (bootError) setError(bootError)
  }, [])

  // Recovery: Firebase signed in but app JWT missing (e.g. API failed during bootstrap).
  useEffect(() => {
    let cancelled = false
    void (async () => {
      await waitForAuthHydration()
      if (cancelled || useAuthStore.getState().token) return
      await firebaseAuth.authStateReady()
      if (cancelled || !firebaseAuth.currentUser) return
      setLoading(true)
      try {
        await exchangeFirebaseToken()
        if (!cancelled) navigate('/job', { replace: true })
      } catch (err: unknown) {
        if (!cancelled) {
          setError(formatFirebaseAuthError(err) || formatAuthError(err))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [navigate])

  useEffect(() => {
    let cancelled = false
    void waitForAuthHydration().then(() => {
      if (!cancelled && useAuthStore.getState().token) {
        navigate('/job', { replace: true })
      }
    })
    return () => {
      cancelled = true
    }
  }, [navigate])

  useEffect(() => {
    if (token) navigate('/job', { replace: true })
  }, [token, navigate])

  const exchangeFirebaseToken = async () => {
    const idToken = await firebaseAuth.currentUser?.getIdToken(true)
    if (!idToken) throw new Error('Could not get Firebase session')
    const { data } = await authApi.firebaseLogin(idToken)
    setToken(data.access_token)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email.trim() || !password) {
      setError('Email and password are required')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    setLoading(true)
    try {
      if (mode === 'signup') {
        await createUserWithEmailAndPassword(firebaseAuth, email.trim(), password)
      } else {
        await signInWithEmailAndPassword(firebaseAuth, email.trim(), password)
      }
      await exchangeFirebaseToken()
      toaster.create({
        title: mode === 'signup' ? 'Account created' : 'Welcome back',
        type: 'success',
      })
      navigate('/job')
    } catch (err: unknown) {
      const fbCode = (err as { code?: string })?.code
      const messages: Record<string, string> = {
        'auth/invalid-credential': 'Invalid email or password',
        'auth/user-not-found': 'No account found for this email',
        'auth/wrong-password': 'Invalid email or password',
        'auth/email-already-in-use': 'An account with this email already exists',
        'auth/weak-password': 'Password is too weak',
        'auth/invalid-email': 'Enter a valid email address',
      }
      setError((fbCode && messages[fbCode]) || formatAuthError(err))
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError('')
    setLoading(true)
    try {
      const result = await signInWithGoogle()
      if (!result) return // redirect flow — page navigates away
      await exchangeFirebaseToken()
      toaster.create({ title: 'Welcome back', type: 'success' })
      navigate('/job')
    } catch (err: unknown) {
      setError(formatFirebaseAuthError(err) || formatAuthError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Flex minH="100vh" align="center" justify="center" p={6} className="login-mesh" bg="bg.canvas">
      <Card maxW="400px" w="full" p={8}>
        <Heading size="xl" mb={2} letterSpacing="-0.02em">
          SkillFit
        </Heading>
        <Text color="fg.muted" fontSize="sm" mb={6}>
          {mode === 'signin'
            ? 'Sign in with your Firebase account to continue.'
            : 'Create an account to get your fit report.'}
        </Text>
        {error && (
          <Box mb={4}>
            <Alert status="error">{error}</Alert>
          </Box>
        )}
        <form onSubmit={handleSubmit}>
          <FormField label={<><HiMail aria-hidden /> Email</>} id="email">
            <FormInput
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </FormField>
          <FormField label={<><HiLockClosed aria-hidden /> Password</>} id="password">
            <FormInput
              id="password"
              type="password"
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
            />
          </FormField>
          <Button type="submit" w="full" loading={loading} icon={<HiLogin aria-hidden />} mb={4}>
            {loading ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </Button>
        </form>
        <Flex align="center" gap={3} my={4}>
          <Box flex={1} h="1px" bg="border.subtle" />
          <Text fontSize="xs" color="fg.muted">
            or
          </Text>
          <Box flex={1} h="1px" bg="border.subtle" />
        </Flex>
        <Button
          variant="outline"
          w="full"
          loading={loading}
          onClick={handleGoogleSignIn}
          icon={<FcGoogle aria-hidden />}
          mb={4}
        >
          Sign in with Google
        </Button>
        <Text fontSize="sm" color="fg.muted" textAlign="center">
            {mode === 'signin' ? (
              <>
                No account?{' '}
                <ChakraLink color="accent.muted" onClick={() => { setMode('signup'); setError('') }}>
                  Sign up
                </ChakraLink>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <ChakraLink color="accent.muted" onClick={() => { setMode('signin'); setError('') }}>
                  Sign in
                </ChakraLink>
              </>
            )}
          </Text>
      </Card>
    </Flex>
  )
}
