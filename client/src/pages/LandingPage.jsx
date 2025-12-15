import { useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import {
  Box,
  Button,
  Container,
  Flex,
  Grid,
  GridItem,
  Heading,
  Icon,
  Link,
  SimpleGrid,
  Stack,
  Text,
  VStack,
  HStack,
  Card,
  CardBody,
  Badge,
  Divider,
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { FileSearch, Shield, Clock, Zap, CheckCircle, ArrowRight, Users } from 'lucide-react'
import Navbar from '../components/Navbar'

const MotionBox = motion(Box)
const MotionButton = motion(Button)

export default function LandingPage() {
  const [hoveredFeature, setHoveredFeature] = useState(null)

  const features = [
    {
      icon: FileSearch,
      title: 'Smart Document Analysis',
      description: 'AI-powered analysis of legal documents with instant summaries and key clause identification.',
      color: 'blue'
    },
    {
      icon: Shield,
      title: 'Risk Detection',
      description: 'Automatically identify risky clauses and potential legal issues in contracts.',
      color: 'red'
    },
    {
      icon: Clock,
      title: 'Save Time',
      description: 'Reduce document review time by up to 80% with intelligent automation.',
      color: 'green'
    },
    {
      icon: Zap,
      title: 'Fast Processing',
      description: 'Lightning-fast document processing powered by advanced AI models.',
      color: 'yellow'
    },
    {
      icon: Users,
      title: 'Team Collaboration',
      description: 'Work seamlessly with your team with real-time document sharing.',
      color: 'purple'
    },
  ]

  const stats = [
    { number: '10K+', label: 'Documents Analyzed' },
    { number: '500+', label: 'Happy Clients' },
    { number: '80%', label: 'Time Saved' },
    { number: '24/7', label: 'Support' },
  ]

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut' },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, duration: 0.3 },
    }),
  }

  return (
    <Box minH="100vh" bg="gray.50">
      <Navbar />

      {/* Hero Section */}
      <Box
        minH="100vh"
        bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
        display="flex"
        alignItems="center"
        justifyContent="center"
        py={20}
        position="relative"
        overflow="hidden"
      >
        {/* Animated background elements */}
        <Box
          position="absolute"
          top="-50%"
          right="-50%"
          w="500px"
          h="500px"
          bg="rgba(255, 255, 255, 0.05)"
          borderRadius="full"
          filter="blur(40px)"
          animation="float 6s ease-in-out infinite"
        />
        <Box
          position="absolute"
          bottom="-50%"
          left="-50%"
          w="500px"
          h="500px"
          bg="rgba(255, 255, 255, 0.05)"
          borderRadius="full"
          filter="blur(40px)"
          animation="float 8s ease-in-out infinite 2s"
        />

        <Container maxW="4xl" position="relative" zIndex={1}>
          <MotionBox
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            textAlign="center"
            color="white"
          >
            <Heading
              as="h1"
              size="3xl"
              mb={6}
              fontWeight="bold"
              letterSpacing="tight"
            >
              India's Leading Legal AI Assistant
            </Heading>

            <Text fontSize="xl" mb={8} opacity={0.95} maxW="2xl" mx="auto">
              Transform your legal practice with AI-powered document analysis, contract review, and intelligent legal insights designed for Indian law firms.
            </Text>

            <HStack spacing={4} justify="center" mb={12}>
              <MotionButton
                as={RouterLink}
                to="/login"
                size="lg"
                bg="white"
                color="purple.600"
                fontWeight="bold"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                rightIcon={<ArrowRight size={20} />}
              >
                Get Started
              </MotionButton>

              <MotionButton
                size="lg"
                variant="outline"
                color="white"
                borderColor="white"
                _hover={{ bg: 'rgba(255, 255, 255, 0.1)' }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Learn More
              </MotionButton>
            </HStack>

            {/* Stats */}
            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={8} mt={16}>
              {stats.map((stat, i) => (
                <MotionBox
                  key={i}
                  custom={i}
                  initial="hidden"
                  animate="visible"
                  variants={itemVariants}
                  textAlign="center"
                >
                  <Heading as="h3" size="xl" mb={2}>
                    {stat.number}
                  </Heading>
                  <Text opacity={0.8}>{stat.label}</Text>
                </MotionBox>
              ))}
            </SimpleGrid>
          </MotionBox>
        </Container>
      </Box>

      {/* Features Section */}
      <Box py={20} bg="white">
        <Container maxW="6xl">
          <MotionBox
            initial="hidden"
            whileInView="visible"
            variants={containerVariants}
            viewport={{ once: true }}
            textAlign="center"
            mb={16}
          >
            <Heading as="h2" size="2xl" mb={4}>
              Powerful Features
            </Heading>
            <Text fontSize="lg" color="gray.600" maxW="2xl" mx="auto">
              Everything you need to streamline your legal practice
            </Text>
          </MotionBox>

          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={8}>
            {features.map((feature, i) => (
              <MotionBox
                key={i}
                custom={i}
                initial="hidden"
                whileInView="visible"
                variants={itemVariants}
                viewport={{ once: true }}
                onMouseEnter={() => setHoveredFeature(i)}
                onMouseLeave={() => setHoveredFeature(null)}
              >
                <Card
                  bg="white"
                  borderWidth="1px"
                  borderColor={hoveredFeature === i ? 'purple.200' : 'gray.200'}
                  boxShadow={hoveredFeature === i ? '0 20px 40px rgba(102, 126, 234, 0.2)' : 'sm'}
                  transition="all 0.3s"
                  h="full"
                >
                  <CardBody>
                    <Flex direction="column" h="full">
                      <Icon
                        as={feature.icon}
                        w={12}
                        h={12}
                        color={`${feature.color}.500`}
                        mb={4}
                      />
                      <Heading as="h3" size="md" mb={3}>
                        {feature.title}
                      </Heading>
                      <Text color="gray.600" flex={1}>
                        {feature.description}
                      </Text>
                      <Flex mt={4} align="center" color="purple.600" fontWeight="medium">
                        Learn more <ArrowRight size={16} style={{ marginLeft: '8px' }} />
                      </Flex>
                    </Flex>
                  </CardBody>
                </Card>
              </MotionBox>
            ))}
          </SimpleGrid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box
        bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
        py={20}
        color="white"
        position="relative"
        overflow="hidden"
      >
        <Container maxW="4xl" position="relative" zIndex={1}>
          <MotionBox
            initial="hidden"
            whileInView="visible"
            variants={containerVariants}
            viewport={{ once: true }}
            textAlign="center"
          >
            <Heading as="h2" size="2xl" mb={4}>
              Ready to Transform Your Legal Practice?
            </Heading>
            <Text fontSize="lg" mb={8} opacity={0.95}>
              Join hundreds of law firms using our AI-powered platform
            </Text>

            <HStack spacing={4} justify="center">
              <MotionButton
                as={RouterLink}
                to="/login"
                size="lg"
                bg="white"
                color="purple.600"
                fontWeight="bold"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Start Free Trial
              </MotionButton>

              <Button
                size="lg"
                variant="outline"
                color="white"
                borderColor="white"
                _hover={{ bg: 'rgba(255, 255, 255, 0.1)' }}
              >
                Request Demo
              </Button>
            </HStack>
          </MotionBox>
        </Container>
      </Box>

      {/* Footer */}
      <Box bg="gray.900" color="gray.400" py={12}>
        <Container maxW="6xl">
          <Flex justify="space-between" align="center" mb={8} direction={{ base: 'column', md: 'row' }} gap={4}>
            <Text fontWeight="bold" color="white">
              Legal AI Suite
            </Text>
            <HStack spacing={6} fontSize="sm">
              <Link>Privacy Policy</Link>
              <Link>Terms of Service</Link>
              <Link>Contact</Link>
            </HStack>
          </Flex>
          <Divider borderColor="gray.700" my={8} />
          <Text textAlign="center" fontSize="sm">
            © 2025 Legal AI Suite. All rights reserved.
          </Text>
        </Container>
      </Box>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(20px); }
        }
      `}</style>
    </Box>
  )
}
