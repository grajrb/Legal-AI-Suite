import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Button,
  Container,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Heading,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Link,
  Stack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  useToast,
  VStack,
  HStack,
  Icon,
  Checkbox,
  Progress,
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react'
import { apiClient, handleApiError, extractFieldErrors } from '../utils/api'
import { validateFormData, loginSchema, registerSchema } from '../utils/validation'
import { sanitizeEmail, sanitizeString, sanitizeObject } from '../utils/sanitize'

const MotionBox = motion(Box)
const MotionButton = motion(Button)

export default function LoginPage() {
  const navigate = useNavigate()
  const toast = useToast()

  // Login state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginErrors, setLoginErrors] = useState({})
  const [showLoginPassword, setShowLoginPassword] = useState(false)

  // Register state
  const [registerEmail, setRegisterEmail] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState('user')
  const [registerLoading, setRegisterLoading] = useState(false)
  const [registerErrors, setRegisterErrors] = useState({})
  const [showRegisterPassword, setShowRegisterPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)

  const calculatePasswordStrength = (password) => {
    let strength = 0
    if (password.length >= 8) strength += 25
    if (password.length >= 12) strength += 25
    if (/[A-Z]/.test(password)) strength += 12.5
    if (/[0-9]/.test(password)) strength += 12.5
    if (/[^A-Za-z0-9]/.test(password)) strength += 25
    return strength
  }

  const handlePasswordChange = (password) => {
    setRegisterPassword(password)
    setPasswordStrength(calculatePasswordStrength(password))
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoginErrors({})

    const validation = validateFormData(loginSchema, {
      email: sanitizeEmail(loginEmail),
      password: loginPassword,
    })

    if (!validation.success && validation.errors) {
      setLoginErrors(validation.errors)
      toast({
        title: 'Validation Error',
        description: Object.values(validation.errors)[0],
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    setLoginLoading(true)

    try {
      const data = await apiClient.post('/api/auth/login', sanitizeObject({
        email: validation.data.email,
        password: validation.data.password,
      }))

      localStorage.setItem('access_token', data.access_token)
      localStorage.setItem('user', JSON.stringify(data.user))

      toast({
        title: 'Login Successful',
        description: `Welcome back, ${data.user.full_name}!`,
        status: 'success',
        duration: 2000,
        isClosable: true,
      })

      const roleRoutes = {
        admin: '/dashboard/admin',
        lawyer: '/dashboard/lawyer',
        paralegal: '/dashboard/paralegal',
      }
      const redirectRoute = roleRoutes[data.user.role] || '/dashboard/lawyer'
      navigate(redirectRoute)
    } catch (error) {
      const errorMessage = handleApiError(error)
      const fieldErrors = extractFieldErrors(error)

      if (Object.keys(fieldErrors).length > 0) {
        setLoginErrors(fieldErrors)
      } else {
        setLoginErrors({ general: errorMessage })
      }

      toast({
        title: 'Login Failed',
        description: errorMessage,
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setLoginLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setRegisterErrors({})

    const validation = validateFormData(registerSchema, {
      email: sanitizeEmail(registerEmail),
      password: registerPassword,
      confirmPassword: confirmPassword,
      fullName: sanitizeString(fullName),
      role,
    })

    if (!validation.success && validation.errors) {
      setRegisterErrors(validation.errors)
      toast({
        title: 'Validation Error',
        description: Object.values(validation.errors)[0],
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    setRegisterLoading(true)

    try {
      const data = await apiClient.post('/api/auth/register', sanitizeObject({
        email: validation.data.email,
        password: validation.data.password,
        full_name: validation.data.fullName,
        role: validation.data.role,
      }))

      localStorage.setItem('access_token', data.access_token)
      localStorage.setItem('user', JSON.stringify(data.user))

      toast({
        title: 'Registration Successful',
        description: `Welcome, ${data.user.full_name}!`,
        status: 'success',
        duration: 2000,
        isClosable: true,
      })

      const roleRoutes = {
        admin: '/dashboard/admin',
        lawyer: '/dashboard/lawyer',
        paralegal: '/dashboard/paralegal',
      }
      const redirectRoute = roleRoutes[data.user.role] || '/dashboard/lawyer'
      navigate(redirectRoute)
    } catch (error) {
      const errorMessage = handleApiError(error)
      const fieldErrors = extractFieldErrors(error)

      if (Object.keys(fieldErrors).length > 0) {
        setRegisterErrors(fieldErrors)
      } else {
        setRegisterErrors({ general: errorMessage })
      }

      toast({
        title: 'Registration Failed',
        description: errorMessage,
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setRegisterLoading(false)
    }
  }

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut' },
    },
  }

  const fieldVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i) => ({
      opacity: 1,
      x: 0,
      transition: { delay: i * 0.1, duration: 0.3 },
    }),
  }

  return (
    <Box minH="100vh" bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)" display="flex" alignItems="center" justifyContent="center" py={10}>
      <Container maxW="md">
        <MotionBox
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          bg="white"
          borderRadius="2xl"
          boxShadow="2xl"
          overflow="hidden"
        >
          {/* Header */}
          <Box bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)" py={8} px={6} textAlign="center">
            <Heading size="2xl" color="white" mb={2}>
              Legal AI Suite
            </Heading>
            <Text color="whiteAlpha.800" fontSize="sm">
              Intelligent Legal Document Analysis
            </Text>
          </Box>

          {/* Tabs */}
          <Tabs isFitted>
            <TabList borderBottomColor="gray.200">
              <Tab>Login</Tab>
              <Tab>Sign Up</Tab>
            </TabList>

            <TabPanels>
              {/* Login Tab */}
              <TabPanel px={6} py={8}>
                <VStack spacing={4} as="form" onSubmit={handleLogin}>
                  {loginErrors.general && (
                    <MotionBox
                      custom={0}
                      variants={fieldVariants}
                      initial="hidden"
                      animate="visible"
                      w="full"
                      p={4}
                      bg="danger.50"
                      borderLeft="4px solid"
                      borderColor="danger.500"
                      borderRadius="md"
                      display="flex"
                      alignItems="center"
                      gap={2}
                    >
                      <Icon as={AlertCircle} color="danger.500" />
                      <Text color="danger.700" fontSize="sm">
                        {loginErrors.general}
                      </Text>
                    </MotionBox>
                  )}

                  <MotionBox custom={0} variants={fieldVariants} initial="hidden" animate="visible" w="full">
                    <FormControl isInvalid={!!loginErrors.email}>
                      <FormLabel fontSize="sm" fontWeight="600" color="gray.700">
                        Email
                      </FormLabel>
                      <InputGroup>
                        <InputLeftElement pointerEvents="none">
                          <Icon as={Mail} color="gray.400" />
                        </InputLeftElement>
                        <Input
                          type="email"
                          placeholder="your@email.com"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          pl={10}
                        />
                      </InputGroup>
                      {loginErrors.email && <FormErrorMessage>{loginErrors.email}</FormErrorMessage>}
                    </FormControl>
                  </MotionBox>

                  <MotionBox custom={1} variants={fieldVariants} initial="hidden" animate="visible" w="full">
                    <FormControl isInvalid={!!loginErrors.password}>
                      <FormLabel fontSize="sm" fontWeight="600" color="gray.700">
                        Password
                      </FormLabel>
                      <InputGroup>
                        <InputLeftElement pointerEvents="none">
                          <Icon as={Lock} color="gray.400" />
                        </InputLeftElement>
                        <Input
                          type={showLoginPassword ? 'text' : 'password'}
                          placeholder="Enter your password"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          pl={10}
                        />
                        <InputRightElement cursor="pointer" onClick={() => setShowLoginPassword(!showLoginPassword)}>
                          <Icon as={showLoginPassword ? EyeOff : Eye} color="gray.400" />
                        </InputRightElement>
                      </InputGroup>
                      {loginErrors.password && <FormErrorMessage>{loginErrors.password}</FormErrorMessage>}
                    </FormControl>
                  </MotionBox>

                  <MotionBox custom={2} variants={fieldVariants} initial="hidden" animate="visible" w="full">
                    <HStack justify="space-between">
                      <Checkbox defaultChecked fontSize="sm">
                        Remember me
                      </Checkbox>
                      <Link color="brand.500" fontSize="sm" fontWeight="600">
                        Forgot password?
                      </Link>
                    </HStack>
                  </MotionBox>

                  <MotionButton
                    custom={3}
                    variants={fieldVariants}
                    initial="hidden"
                    animate="visible"
                    w="full"
                    bg="brand.500"
                    color="white"
                    type="submit"
                    isLoading={loginLoading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Sign In
                  </MotionButton>
                </VStack>
              </TabPanel>

              {/* Register Tab */}
              <TabPanel px={6} py={8}>
                <VStack spacing={4} as="form" onSubmit={handleRegister}>
                  {registerErrors.general && (
                    <MotionBox
                      custom={0}
                      variants={fieldVariants}
                      initial="hidden"
                      animate="visible"
                      w="full"
                      p={4}
                      bg="danger.50"
                      borderLeft="4px solid"
                      borderColor="danger.500"
                      borderRadius="md"
                      display="flex"
                      alignItems="center"
                      gap={2}
                    >
                      <Icon as={AlertCircle} color="danger.500" />
                      <Text color="danger.700" fontSize="sm">
                        {registerErrors.general}
                      </Text>
                    </MotionBox>
                  )}

                  <MotionBox custom={0} variants={fieldVariants} initial="hidden" animate="visible" w="full">
                    <FormControl isInvalid={!!registerErrors.fullName}>
                      <FormLabel fontSize="sm" fontWeight="600" color="gray.700">
                        Full Name
                      </FormLabel>
                      <Input
                        placeholder="John Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                      />
                      {registerErrors.fullName && <FormErrorMessage>{registerErrors.fullName}</FormErrorMessage>}
                    </FormControl>
                  </MotionBox>

                  <MotionBox custom={1} variants={fieldVariants} initial="hidden" animate="visible" w="full">
                    <FormControl isInvalid={!!registerErrors.email}>
                      <FormLabel fontSize="sm" fontWeight="600" color="gray.700">
                        Email
                      </FormLabel>
                      <InputGroup>
                        <InputLeftElement pointerEvents="none">
                          <Icon as={Mail} color="gray.400" />
                        </InputLeftElement>
                        <Input
                          type="email"
                          placeholder="your@email.com"
                          value={registerEmail}
                          onChange={(e) => setRegisterEmail(e.target.value)}
                          pl={10}
                        />
                      </InputGroup>
                      {registerErrors.email && <FormErrorMessage>{registerErrors.email}</FormErrorMessage>}
                    </FormControl>
                  </MotionBox>

                  <MotionBox custom={2} variants={fieldVariants} initial="hidden" animate="visible" w="full">
                    <FormControl isInvalid={!!registerErrors.password}>
                      <FormLabel fontSize="sm" fontWeight="600" color="gray.700">
                        Password
                      </FormLabel>
                      <InputGroup>
                        <InputLeftElement pointerEvents="none">
                          <Icon as={Lock} color="gray.400" />
                        </InputLeftElement>
                        <Input
                          type={showRegisterPassword ? 'text' : 'password'}
                          placeholder="Create a strong password"
                          value={registerPassword}
                          onChange={(e) => handlePasswordChange(e.target.value)}
                          pl={10}
                        />
                        <InputRightElement cursor="pointer" onClick={() => setShowRegisterPassword(!showRegisterPassword)}>
                          <Icon as={showRegisterPassword ? EyeOff : Eye} color="gray.400" />
                        </InputRightElement>
                      </InputGroup>
                      {registerErrors.password && <FormErrorMessage>{registerErrors.password}</FormErrorMessage>}
                      {registerPassword && (
                        <>
                          <Progress value={passwordStrength} size="xs" mt={2} colorScheme={passwordStrength < 50 ? 'red' : passwordStrength < 75 ? 'yellow' : 'green'} />
                          <FormHelperText fontSize="xs">
                            {passwordStrength < 50 && '❌ Weak password'}
                            {passwordStrength >= 50 && passwordStrength < 75 && '⚠️ Medium password'}
                            {passwordStrength >= 75 && '✅ Strong password'}
                          </FormHelperText>
                        </>
                      )}
                    </FormControl>
                  </MotionBox>

                  <MotionBox custom={3} variants={fieldVariants} initial="hidden" animate="visible" w="full">
                    <FormControl isInvalid={!!registerErrors.confirmPassword}>
                      <FormLabel fontSize="sm" fontWeight="600" color="gray.700">
                        Confirm Password
                      </FormLabel>
                      <InputGroup>
                        <InputLeftElement pointerEvents="none">
                          <Icon as={Lock} color="gray.400" />
                        </InputLeftElement>
                        <Input
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Confirm your password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          pl={10}
                        />
                        <InputRightElement cursor="pointer" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                          <Icon as={showConfirmPassword ? EyeOff : Eye} color="gray.400" />
                        </InputRightElement>
                      </InputGroup>
                      {registerErrors.confirmPassword && <FormErrorMessage>{registerErrors.confirmPassword}</FormErrorMessage>}
                    </FormControl>
                  </MotionBox>

                  <MotionButton
                    custom={4}
                    variants={fieldVariants}
                    initial="hidden"
                    animate="visible"
                    w="full"
                    bg="brand.500"
                    color="white"
                    type="submit"
                    isLoading={registerLoading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Create Account
                  </MotionButton>
                </VStack>
              </TabPanel>
            </TabPanels>
          </Tabs>

          {/* Footer */}
          <Box py={4} px={6} bg="gray.50" borderTop="1px solid" borderColor="gray.200" textAlign="center">
            <Text fontSize="xs" color="gray.600">
              By signing up, you agree to our{' '}
              <Link color="brand.500" fontWeight="600">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link color="brand.500" fontWeight="600">
                Privacy Policy
              </Link>
            </Text>
          </Box>
        </MotionBox>
      </Container>
    </Box>
  )
}
