import { useEffect, useState } from 'react'
import { Container, Box, Heading, HStack, Button, Input, FormControl, FormLabel, VStack, Select, useToast } from '@chakra-ui/react'
import Navbar from '../components/Navbar'
import Card from '../components/Card'
import LoadingSpinner from '../components/LoadingSpinner'
import { apiClient } from '../utils/api'

export default function FoldersPage() {
  const [matters, setMatters] = useState([])
  const [matterId, setMatterId] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(true)
  const toast = useToast()

  useEffect(() => {
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
    load()
  }, [])

  const createFolder = async () => {
    if (!matterId || !name.trim()) return
    try {
      await apiClient.post('/api/folders', { matter_id: matterId, name })
      setName('')
      toast({ title: 'Folder created', status: 'success' })
    } catch (e) {
      toast({ title: 'Error', description: e.message || 'Failed to create folder', status: 'error' })
    }
  }

  return (
    <Box>
      <Navbar />
      <Container maxW="6xl" py={8}>
        <Heading mb={6}>Folders</Heading>
        <Card>
          {loading ? (
            <LoadingSpinner />
          ) : (
            <VStack align="stretch" spacing={4}>
              <FormControl>
                <FormLabel>Matter</FormLabel>
                <Select placeholder="Select matter" value={matterId} onChange={(e) => setMatterId(e.target.value)}>
                  {matters.map((m) => (
                    <option key={m.id} value={m.id}>{m.title}</option>
                  ))}
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>Folder name</FormLabel>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Disclosure" />
              </FormControl>
              <HStack>
                <Button onClick={createFolder} colorScheme="purple">Create</Button>
              </HStack>
            </VStack>
          )}
        </Card>
      </Container>
    </Box>
  )
}
