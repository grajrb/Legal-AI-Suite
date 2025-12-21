import { useEffect, useState } from 'react'
import { Container, Box, Heading, HStack, Button, Input, FormControl, FormLabel, VStack, Table, Thead, Tr, Th, Tbody, Td, useToast, Textarea } from '@chakra-ui/react'
import Navbar from '../components/Navbar'
import Card from '../components/Card'
import LoadingSpinner from '../components/LoadingSpinner'
import { apiClient } from '../utils/api'

export default function MattersPage() {
  const [matters, setMatters] = useState([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(true)
  const toast = useToast()

  const load = async () => {
    try {
      setLoading(true)
      const res = await apiClient.get('/api/matters')
      setMatters(res.data?.active_matters || [])
    } catch (e) {
      toast({ title: 'Error', description: e.message || 'Failed to load matters', status: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const createMatter = async () => {
    if (!title.trim()) return
    try {
      const res = await apiClient.post('/api/matters', { title, description })
      toast({ title: 'Matter created', status: 'success' })
      setTitle(''); setDescription('')
      load()
    } catch (e) {
      toast({ title: 'Error', description: e.message || 'Failed to create matter', status: 'error' })
    }
  }

  useEffect(() => { load() }, [])

  return (
    <Box>
      <Navbar />
      <Container maxW="6xl" py={8}>
        <Heading mb={6}>Matters</Heading>
        <Card>
          <VStack align="stretch" spacing={4}>
            <FormControl>
              <FormLabel>Title</FormLabel>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Dispute with Vendor" />
            </FormControl>
            <FormControl>
              <FormLabel>Description</FormLabel>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" />
            </FormControl>
            <HStack>
              <Button onClick={createMatter} colorScheme="purple">Create</Button>
            </HStack>
          </VStack>
        </Card>

        <Card>
          {loading ? (
            <LoadingSpinner />
          ) : (
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Title</Th>
                  <Th>Status</Th>
                  <Th>Deadline</Th>
                </Tr>
              </Thead>
              <Tbody>
                {matters.length === 0 ? (
                  <Tr><Td colSpan={3}>No matters yet</Td></Tr>
                ) : matters.map((m) => (
                  <Tr key={m.id}>
                    <Td>{m.title}</Td>
                    <Td>{m.status}</Td>
                    <Td>{m.deadline || '-'}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </Card>
      </Container>
    </Box>
  )
}
