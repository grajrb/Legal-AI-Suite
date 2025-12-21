import { useState, useEffect } from 'react'
import {
  Box,
  Container,
  Grid,
  Heading,
  Text,
  VStack,
  HStack,
  Flex,
  Badge,
  useToast,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from '@chakra-ui/react'
import { Users, FileText, AlertTriangle, Activity, TrendingUp, Clock } from 'lucide-react'
import { Line, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import StatCard from '../components/StatCard'
import Card from '../components/Card'
import LoadingSpinner from '../components/LoadingSpinner'
import { apiClient } from '../utils/api'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

const MotionBox = motion(Box)

export default function AdminDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [stats, setStats] = useState(null)
  const [activityData, setActivityData] = useState([])
  const [loading, setLoading] = useState(true)
  const [auditCount, setAuditCount] = useState(0)

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login')
      return
    }
    fetchDashboardData()
  }, [user, navigate])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/api/stats')
      // Also fetch recent audit logs (role: admin)
      try {
        const auditRes = await apiClient.get('/api/audit')
        setAuditCount((auditRes.data?.logs || []).length)
      } catch {}

      setStats(response.data || {
        total_users: 0,
        total_documents: 0,
        active_matters: 0,
        risky_clauses_detected: 0,
        documents_reviewed_today: 0,
        pending_reviews: 0,
      })

      // Mock activity data for chart
      setActivityData([
        { date: 'Mon', count: 12 },
        { date: 'Tue', count: 19 },
        { date: 'Wed', count: 15 },
        { date: 'Thu', count: 25 },
        { date: 'Fri', count: 22 },
        { date: 'Sat', count: 8 },
        { date: 'Sun', count: 5 },
      ])
    } catch (err) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to fetch dashboard data',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }

  const statCards = stats ? [
    {
      icon: Users,
      label: 'Total Users',
      value: stats.total_users,
      color: 'blue.500',
      trend: 12
    },
    {
      icon: Activity,
      label: 'Audit Events',
      value: auditCount,
      color: 'teal.500',
      trend: null
    },
    {
      icon: FileText,
      label: 'Total Documents',
      value: stats.total_documents,
      color: 'green.500',
      trend: 8
    },
    {
      icon: Activity,
      label: 'Active Matters',
      value: stats.active_matters,
      color: 'purple.500',
      trend: 5
    },
    {
      icon: AlertTriangle,
      label: 'Risky Clauses',
      value: stats.risky_clauses_detected,
      color: 'red.500',
      trend: -3
    },
    {
      icon: TrendingUp,
      label: 'Reviewed Today',
      value: stats.documents_reviewed_today,
      color: 'orange.500',
      trend: 15
    },
    {
      icon: Clock,
      label: 'Pending Reviews',
      value: stats.pending_reviews,
      color: 'yellow.600',
      trend: null
    },
  ] : []

  // Activity chart data
  const activityChartData = {
    labels: activityData.map(d => d.date),
    datasets: [
      {
        label: 'Documents Processed',
        data: activityData.map(d => d.count),
        borderColor: '#6366F1',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  }

  const activityChartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  }

  // Document status chart
  const statusChartData = {
    labels: ['Pending', 'Reviewed', 'Flagged'],
    datasets: [
      {
        data: [45, 120, 18],
        backgroundColor: ['#F59E0B', '#10B981', '#EF4444'],
        borderWidth: 0,
      },
    ],
  }

  const recentActivities = [
    { action: 'Document uploaded', user: 'Priya Sharma', time: '2 hours ago', type: 'upload' },
    { action: 'Contract reviewed', user: 'Raj Patel', time: '3 hours ago', type: 'review' },
    { action: 'Risk alert triggered', user: 'System', time: '5 hours ago', type: 'alert' },
    { action: 'New user added', user: 'Admin', time: '1 day ago', type: 'user' },
    { action: 'Matter created', user: 'Priya Sharma', time: '1 day ago', type: 'matter' },
  ]

  const systemHealth = [
    { name: 'API Response Time', status: 'Healthy', color: 'green' },
    { name: 'Database Status', status: 'Connected', color: 'green' },
    { name: 'OCR Service', status: 'Active', color: 'green' },
    { name: 'AI Processing', status: 'Mock Mode', color: 'yellow' },
  ]

  if (loading) {
    return (
      <Box minH="100vh" bg="gray.50">
        <Navbar />
        <Container maxW="container.xl" py={8}>
          <LoadingSpinner message="Loading dashboard..." />
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
          transition={{ duration: 0.5 }}
          mb={8}
        >
          <Heading size="xl" color="gray.800" mb={2}>
            Firm Admin Dashboard
          </Heading>
          <Text color="gray.600" fontSize="lg">
            Overview of your law firm's legal workspace
          </Text>
        </MotionBox>

        {/* Stats Grid */}
        <Grid
          templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }}
          gap={6}
          mb={8}
        >
          {statCards.map((card, index) => (
            <StatCard
              key={index}
              icon={card.icon}
              label={card.label}
              value={card.value}
              color={card.color}
              trend={card.trend}
              delay={index * 0.1}
            />
          ))}
        </Grid>

        {/* Charts Section */}
        <Grid
          templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }}
          gap={6}
          mb={8}
        >
          {/* Activity Chart */}
          <Card>
            <Heading size="md" mb={4}>
              Weekly Activity
            </Heading>
            <Box h="300px">
              <Line data={activityChartData} options={activityChartOptions} />
            </Box>
          </Card>

          {/* Status Chart */}
          <Card>
            <Heading size="md" mb={4}>
              Document Status
            </Heading>
            <Flex justify="center" align="center" h="300px">
              <Box w="250px" h="250px">
                <Doughnut data={statusChartData} />
              </Box>
            </Flex>
          </Card>
        </Grid>

        {/* Tabs Section */}
        <Card>
          <Tabs colorScheme="brand" variant="enclosed">
            <TabList>
              <Tab>Recent Activity</Tab>
              <Tab>System Health</Tab>
            </TabList>

            <TabPanels>
              {/* Recent Activity */}
              <TabPanel px={0}>
                <VStack spacing={0} divider={<Box h="1px" bg="gray.100" />}>
                  {recentActivities.map((activity, index) => (
                    <MotionBox
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      w="full"
                      py={4}
                      px={6}
                    >
                      <Flex justify="space-between" align="center">
                        <HStack spacing={4}>
                          <Badge
                            colorScheme={
                              activity.type === 'alert' ? 'red' :
                                activity.type === 'upload' ? 'blue' :
                                  activity.type === 'review' ? 'green' :
                                    'purple'
                            }
                            fontSize="xs"
                            px={2}
                            py={1}
                            borderRadius="md"
                          >
                            {activity.type}
                          </Badge>
                          <Box>
                            <Text fontWeight="medium" color="gray.800">
                              {activity.action}
                            </Text>
                            <Text fontSize="sm" color="gray.500">
                              by {activity.user}
                            </Text>
                          </Box>
                        </HStack>
                        <Text fontSize="xs" color="gray.400">
                          {activity.time}
                        </Text>
                      </Flex>
                    </MotionBox>
                  ))}
                </VStack>
              </TabPanel>

              {/* System Health */}
              <TabPanel px={6}>
                <VStack spacing={4} align="stretch">
                  {systemHealth.map((item, index) => (
                    <MotionBox
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Flex justify="space-between" align="center" py={3}>
                        <Text color="gray.700" fontWeight="medium">
                          {item.name}
                        </Text>
                        <HStack spacing={2}>
                          <Box
                            w="8px"
                            h="8px"
                            borderRadius="full"
                            bg={item.color === 'green' ? 'green.500' : 'yellow.500'}
                          />
                          <Text fontSize="sm" color="gray.600">
                            {item.status}
                          </Text>
                        </HStack>
                      </Flex>
                    </MotionBox>
                  ))}
                </VStack>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Card>
      </Container>
    </Box>
  )
}
