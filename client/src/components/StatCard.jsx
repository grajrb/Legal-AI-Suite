import { Box, Text, Icon, Flex, Skeleton } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import Card from './Card'

const MotionBox = motion(Box)

export default function StatCard({
  icon,
  label,
  value,
  color = 'brand.500',
  trend = null,
  loading = false,
  delay = 0
}) {
  const cardVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.4,
        delay: delay,
        ease: 'easeOut'
      }
    }
  }

  if (loading) {
    return (
      <Card animation={false}>
        <Flex align="center" gap={4}>
          <Skeleton w="48px" h="48px" borderRadius="lg" />
          <Box flex="1">
            <Skeleton h="16px" w="60%" mb={2} />
            <Skeleton h="32px" w="40%" />
          </Box>
        </Flex>
      </Card>
    )
  }

  return (
    <MotionBox
      as={Card}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Flex align="center" gap={4}>
        <Box
          bg={color}
          w="48px"
          h="48px"
          borderRadius="lg"
          display="flex"
          alignItems="center"
          justifyContent="center"
          color="white"
        >
          <Icon as={icon} boxSize={6} />
        </Box>

        <Box flex="1">
          <Text fontSize="sm" color="gray.600" mb={1}>
            {label}
          </Text>
          <Flex align="baseline" gap={2}>
            <Text fontSize="3xl" fontWeight="bold" color="gray.800">
              {value}
            </Text>
            {trend && (
              <Text
                fontSize="sm"
                color={trend > 0 ? 'green.500' : 'red.500'}
                fontWeight="medium"
              >
                {trend > 0 ? '+' : ''}{trend}%
              </Text>
            )}
          </Flex>
        </Box>
      </Flex>
    </MotionBox>
  )
}
