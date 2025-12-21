import { useState } from 'react'
import { Container, Box, Heading, VStack, Textarea, Button, useToast, Code } from '@chakra-ui/react'
import Navbar from '../components/Navbar'
import Card from '../components/Card'
import { apiClient } from '../utils/api'

export default function AdminAssistant() {
  const [question, setQuestion] = useState('Summarize all high-risk matters this week.')
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  const runQuery = async () => {
    if (!question.trim()) return
    try {
      setLoading(true)
      const res = await apiClient.post('/api/assistant/query', { question })
      setReport(res.data)
    } catch (e) {
      toast({ title: 'Error', description: e.message || 'Query failed', status: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box>
      <Navbar />
      <Container maxW="6xl" py={8}>
        <Heading mb={6}>Admin Assistant (Structured)</Heading>
        <Card>
          <VStack align="stretch" spacing={4}>
            <Textarea value={question} onChange={(e) => setQuestion(e.target.value)} rows={4} />
            <Button onClick={runQuery} colorScheme="purple" isLoading={loading}>Run</Button>
            {report && (
              <Box>
                <Heading size="md" mb={2}>Result</Heading>
                <Code whiteSpace="pre-wrap" p={4} w="full">{JSON.stringify(report, null, 2)}</Code>
              </Box>
            )}
          </VStack>
        </Card>
      </Container>
    </Box>
  )
}
