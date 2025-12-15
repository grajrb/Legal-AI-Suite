import { useState, useEffect } from 'react'
import {
  Box,
  Container,
  Grid,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  Button,
  useToast,
  Icon,
  Flex,
} from '@chakra-ui/react'
import { Upload, AlertCircle, CheckCircle, Clock, FileWarning, RefreshCw } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import StatCard from '../components/StatCard'
import Card from '../components/Card'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'
import { apiClient } from '../utils/api'

const MotionBox = motion(Box)

export default function ParalegalDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [tasks, setTasks] = useState([])
  const [ocrFailures, setOcrFailures] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || user.role !== 'paralegal') {
      navigate('/login')
      return
    }
    fetchTasks()
  }, [user, navigate])

  const fetchTasks = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/api/paralegal-tasks')
      setTasks(response.data?.upload_queue || [])
      setOcrFailures(response.data?.ocr_failures || [])
    } catch (err) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to fetch tasks',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }

  const stats = [
    { label: 'Documents Processed', value: '156', change: '+12 today', color: 'blue.500', icon: CheckCircle },
    { label: 'Avg. Processing Time', value: '2.3s', change: '-0.5s faster', color: 'green.500', icon: Clock },
    { label: 'Success Rate', value: '97.2%', change: '+1.2% up', color: 'purple.500', icon: Upload },
  ]

  if (loading) {
    return (
      <Box minH="100vh" bg="gray.50">
        <Navbar />
        <Container maxW="container.xl" py={8}>
          <LoadingSpinner message="Loading tasks..." />
        </Container>
      </Box>
    )
  }

  return (
    <Box minH="100vh" bg="gray.50">
      <Navbar />

      <Container maxW="container.xl" py={8}>
        {/* Header */}
        <MotionBox
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          mb={8}
        >
          <Heading size="xl" color="gray.800" mb={2}>
            Paralegal Dashboard
          </Heading>
          <Text color="gray.600" fontSize="lg">
            Manage document uploads and processing
          </Text>
        </MotionBox>

        {/* Stats */}
        <Grid
          templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }}
          gap={6}
          mb={8}
        >
          {stats.map((stat, index) => (
            <StatCard
              key={index}
              icon={stat.icon}
              label={stat.label}
              value={stat.value}
              color={stat.color}
              delay={index * 0.1}
            />
          ))}
        </Grid>

        {/* Main Content Grid */}
        <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap={6} mb={8}>
          {/* Upload Queue */}
          <Card>
            <Flex justify="space-between" align="center" mb={4}>
              <HStack spacing={2}>
                <Icon as={Upload} boxSize={6} color="blue.500" />
                <Heading size="md">Upload Queue</Heading>
              </HStack>
              <Badge colorScheme="blue" fontSize="sm" px={2} py={1}>
                {tasks.length} pending
              </Badge>
            </Flex>

            {tasks.length === 0 ? (
              <EmptyState
                icon={Upload}
                title="No documents in queue"
                description="All uploads have been processed"
              />
            ) : (
              <VStack spacing={0} divider={<Box h="1px" bg="gray.100" />}>
                {tasks.map((item, index) => (
                  <MotionBox
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    w="full"
                    py={4}
                  >
                    <Flex align="center" gap={3}>
                      <Box
                        w="40px"
                        h="40px"
                        bg="blue.100"
                        borderRadius="lg"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Icon as={Upload} boxSize={5} color="blue.600" />
                      </Box>
                      <Box flex="1">
                        <Text fontWeight="medium" color="gray.800">
                          {item.filename}
                        </Text>
                        <HStack spacing={2} mt={1}>
                          {item.status === 'processing' && <Icon as={RefreshCw} boxSize={4} color="blue.500" className="spin" />}
                          {item.status === 'queued' && <Icon as={Clock} boxSize={4} color="gray.400" />}
                          {item.status === 'completed' && <Icon as={CheckCircle} boxSize={4} color="green.500" />}
                          <Text fontSize="sm" color="gray.500">
                            {item.status}
                          </Text>
                        </HStack>
                      </Box>
                    </Flex>
                  </MotionBox>
                ))}
              </VStack>
            )}
          </Card>

          {/* OCR Failures */}
          <Card>
            <Flex justify="space-between" align="center" mb={4}>
              <HStack spacing={2}>
                <Icon as={FileWarning} boxSize={6} color="red.500" />
                <Heading size="md">OCR Failures</Heading>
              </HStack>
              <Badge colorScheme="red" fontSize="sm" px={2} py={1}>
                {ocrFailures.length} issues
              </Badge>
            </Flex>

            {ocrFailures.length === 0 ? (
              <EmptyState
                icon={CheckCircle}
                title="No OCR failures"
                description="All documents processed successfully!"
              />
            ) : (
              <VStack spacing={0} divider={<Box h="1px" bg="gray.100" />}>
                {ocrFailures.map((item, index) => (
                  <MotionBox
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    w="full"
                    py={4}
                  >
                    <Flex align="start" gap={3}>
                      <Box
                        w="40px"
                        h="40px"
                        bg="red.100"
                        borderRadius="lg"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        flexShrink={0}
                      >
                        <Icon as={AlertCircle} boxSize={5} color="red.600" />
                      </Box>
                      <Box flex="1">
                        <Text fontWeight="medium" color="gray.800">
                          {item.filename}
                        </Text>
                        <Text fontSize="sm" color="red.600" mt={1}>
                          {item.error}
                        </Text>
                        <Text fontSize="xs" color="gray.400" mt={1}>
                          {item.date}
                        </Text>
                      </Box>
                      <Button
                        size="sm"
                        colorScheme="blue"
                        variant="ghost"
                        onClick={() => toast({ title: 'Retry feature coming soon!', status: 'info' })}
                      >
                        Retry
                      </Button>
                    </Flex>
                  </MotionBox>
                ))}
              </VStack>
            )}
          </Card>
        </Grid>

        {/* Upload New Document */}
        <Card>
          <Heading size="md" mb={4}>
            Upload New Document
          </Heading>
          <Box
            border="2px dashed"
            borderColor="gray.300"
            borderRadius="lg"
            p={8}
            textAlign="center"
            _hover={{ borderColor: 'blue.400', bg: 'blue.50' }}
            transition="all 0.2s"
            cursor="pointer"
            onClick={() => toast({ title: 'Upload feature coming soon!', status: 'info' })}
          >
            <Icon as={Upload} boxSize={12} color="gray.400" mx="auto" mb={4} />
            <Text color="gray.600" mb={2}>
              Drag and drop files here, or click to browse
            </Text>
            <Text fontSize="sm" color="gray.400">
              Supports PDF, DOC, DOCX (Max 50MB)
            </Text>
          </Box>
        </Card>
      </Container>
    </Box>
  )
}
