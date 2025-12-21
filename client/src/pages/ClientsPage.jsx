import { useEffect, useState } from 'react'
import { Container, Box, Heading, HStack, Button, Input, FormControl, FormLabel, VStack, Table, Thead, Tr, Th, Tbody, Td, useToast } from '@chakra-ui/react'
import Navbar from '../components/Navbar'
import Card from '../components/Card'
import LoadingSpinner from '../components/LoadingSpinner'
import { apiClient } from '../utils/api'

export default function ClientsPage() {
  const [clients, setClients] = useState([])
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(true)
  const toast = useToast()

  const load = async () => {
    try {
      setLoading(true)
      const res = await apiClient.get('/api/clients')
      setClients(res.data?.clients || [])
    } catch (e) {
      toast({ title: 'Error', description: e.message || 'Failed to load clients', status: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const createClient = async () => {
    if (!name.trim()) return
    try {
      const res = await apiClient.post('/api/clients', { name })
      setClients((prev) => [res.data, ...prev])
      setName('')
      toast({ title: 'Client created', status: 'success' })
    } catch (e) {
      toast({ title: 'Error', description: e.message || 'Failed to create client', status: 'error' })
    }
  }

  useEffect(() => { load() }, [])

  return (
    <Box>
      <Navbar />
      <Container maxW="6xl" py={8}>
        <Heading mb={6}>Clients</Heading>
        <Card>
          <VStack align="stretch" spacing={4}>
            <FormControl>
              <FormLabel>New Client Name</FormLabel>
              <HStack>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Acme Corp" />
                <Button onClick={createClient} colorScheme="purple">Create</Button>
              </HStack>
            </FormControl>
          </VStack>
        </Card>

        <Card>
          {loading ? (
            <LoadingSpinner />
          ) : (
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Name</Th>
                </Tr>
              </Thead>
              <Tbody>
                {clients.length === 0 ? (
                  <Tr><Td>No clients yet</Td></Tr>
                ) : clients.map((c) => (
                  <Tr key={c.id || c.name}>
                    <Td>{c.name}</Td>
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
