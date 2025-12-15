import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { Box, Flex, HStack, Button, Text, Icon, Container, Link } from '@chakra-ui/react'
import { LogOut, User, Scale } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <Box
      bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
      color="white"
      boxShadow="md"
      position="sticky"
      top={0}
      zIndex={100}
    >
      <Container maxW="6xl">
        <Flex h="64px" alignItems="center" justifyContent="space-between">
          <Flex as={RouterLink} to="/" alignItems="center" gap={2} cursor="pointer" _hover={{ opacity: 0.8 }} transition="opacity 0.2s">
            <Icon as={Scale} w={6} h={6} color="white" />
            <Text fontSize="xl" fontWeight="bold">
              Legal AI
            </Text>
          </Flex>

          <HStack spacing={4}>
            {user ? (
              <>
                <HStack spacing={2} fontSize="sm">
                  <Icon as={User} w={4} h={4} />
                  <Text>{user.full_name || user.name}</Text>
                  <Text color="whiteAlpha.80" textTransform="capitalize">
                    ({user.role})
                  </Text>
                </HStack>
                <Button
                  size="sm"
                  leftIcon={<LogOut size={16} />}
                  onClick={handleLogout}
                  bg="whiteAlpha.20"
                  _hover={{ bg: 'whiteAlpha.30' }}
                >
                  Logout
                </Button>
              </>
            ) : (
              <Button
                as={RouterLink}
                to="/login"
                size="sm"
                bg="white"
                color="purple.600"
                fontWeight="bold"
                _hover={{ bg: 'gray.100' }}
              >
                Sign In
              </Button>
            )}
          </HStack>
        </Flex>
      </Container>
    </Box>
  )
}
