import { Flex, Spinner, Text, VStack } from '@chakra-ui/react'
import { motion } from 'framer-motion'

const MotionFlex = motion(Flex)

export default function LoadingSpinner({ message = "Loading...", fullScreen = false }) {
  const content = (
    <VStack spacing={4}>
      <Spinner
        thickness="4px"
        speed="0.65s"
        emptyColor="gray.200"
        color="brand.500"
        size="xl"
      />
      {message && (
        <Text color="gray.600" fontSize="md">
          {message}
        </Text>
      )}
    </VStack>
  )

  if (fullScreen) {
    return (
      <MotionFlex
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        position="fixed"
        top="0"
        left="0"
        right="0"
        bottom="0"
        bg="rgba(255, 255, 255, 0.9)"
        zIndex="9999"
        align="center"
        justify="center"
      >
        {content}
      </MotionFlex>
    )
  }

  return (
    <Flex align="center" justify="center" py={12}>
      {content}
    </Flex>
  )
}
