import { Box } from '@chakra-ui/react'
import { motion } from 'framer-motion'

const MotionBox = motion(Box)

export default function Card({ children, hover = true, animation = true, ...props }) {
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 }
    },
    hover: {
      y: -4,
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
      transition: { duration: 0.2 }
    }
  }

  const baseStyles = {
    bg: 'white',
    borderRadius: 'xl',
    p: 6,
    boxShadow: 'sm',
    border: '1px solid',
    borderColor: 'gray.100',
  }

  if (!animation) {
    return (
      <Box
        {...baseStyles}
        _hover={hover ? { boxShadow: 'md', transform: 'translateY(-2px)' } : {}}
        transition="all 0.2s"
        {...props}
      >
        {children}
      </Box>
    )
  }

  return (
    <MotionBox
      {...baseStyles}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={hover ? "hover" : {}}
      {...props}
    >
      {children}
    </MotionBox>
  )
}
