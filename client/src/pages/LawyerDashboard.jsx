import { useEffect, useState } from 'react'
import {
  Box,
  Container,
  Grid,
  Heading,
  Text,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  useToast,
  Icon,
} from '@chakra-ui/react'
import { Calendar, FileText, AlertCircle, Plus } from 'lucide-react'
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

export default function LawyerDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [matters, setMatters] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || user.role !== 'lawyer') {
      navigate('/login')
      return
    }
    fetchMatters()
  }, [user, navigate])

  const fetchMatters = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/api/matters')
      setMatters(response.data?.matters || [])
    } catch (err) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to fetch matters',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }

  const stats = [
    {
      icon: FileText,
      label: 'Active Matters',
      value: matters.filter(m => m.status === 'active').length,
      color: 'blue.500'
    },
    {
      icon: Calendar,
      label: 'Pending Documents',
      value: matters.filter(m => m.pending_docs > 0).length,
      color: 'orange.500'
    },
    {
      icon: AlertCircle,
      label: 'Upcoming Deadlines',
      value: matters.filter(m => m.deadline_urgent).length,
      color: 'red.500'
    },
  ]

  if (loading) {
    return (
      <Box minH="100vh" bg="gray.50">
        <Navbar />
        <Container maxW="container.xl" py={8}>
          <LoadingSpinner message="Loading matters..." />
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
            Lawyer Dashboard
          </Heading>
          <Text color="gray.600" fontSize="lg">
            Manage your legal matters and documents
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

        {/* Matters List */}
        <Card>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={6}>
            <Heading size="md">Your Matters</Heading>
            <Button
              leftIcon={<Icon as={Plus} />}
              colorScheme="brand"
              onClick={() => toast({ title: 'Feature coming soon!', status: 'info' })}
            >
              New Matter
            </Button>
          </Box>

          {matters.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No matters yet"
              description="Create your first matter to get started"
              actionLabel="Create Matter"
              onAction={() => toast({ title: 'Feature coming soon!', status: 'info' })}
            />
          ) : (
            <Box overflowX="auto">
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Matter Name</Th>
                    <Th>Client</Th>
                    <Th>Status</Th>
                    <Th>Deadline</Th>
                    <Th>Documents</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {matters.map(matter => (
                    <Tr key={matter.id} _hover={{ bg: 'gray.50' }}>
                      <Td fontWeight="medium">{matter.name}</Td>
                      <Td>{matter.client_name}</Td>
                      <Td>
                        <Badge
                          colorScheme={
                            matter.status === 'active' ? 'green' :
                              matter.status === 'closed' ? 'gray' : 'yellow'
                          }
                        >
                          {matter.status.charAt(0).toUpperCase() + matter.status.slice(1)}
                        </Badge>
                      </Td>
                      <Td>{matter.deadline || 'N/A'}</Td>
                      <Td>{matter.document_count || 0}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          )}
        </Card>
      </Container>
    </Box>
  )
}
