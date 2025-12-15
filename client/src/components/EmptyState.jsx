import { Box, Text, Button, Icon, VStack } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { Inbox } from 'lucide-react'

const MotionBox = motion(Box)

export default function EmptyState({
  icon = Inbox,
  title = "No items found",
  description = "Get started by adding your first item",
  actionLabel = null,
  onAction = null
}) {
  return (
    <MotionBox
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      py={12}
    >
      <VStack spacing={4} textAlign="center">
        <Box
          bg="gray.100"
          w="80px"
          h="80px"
          borderRadius="full"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Icon as={icon} boxSize={10} color="gray.400" />
        </Box>

        <Box>
          <Text fontSize="xl" fontWeight="semibold" color="gray.800" mb={2}>
            {title}
          </Text>
          <Text fontSize="md" color="gray.600">
            {description}
          </Text>
        </Box>

        {actionLabel && onAction && (
          <Button
            colorScheme="brand"
            size="lg"
            onClick={onAction}
            mt={4}
          >
            {actionLabel}
          </Button>
        )}
      </VStack>
    </MotionBox>
  )
}
