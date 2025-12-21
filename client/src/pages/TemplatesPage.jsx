import { useEffect, useState } from 'react'
import { Container, Box, Heading, HStack, Button, Input, FormControl, FormLabel, VStack, Table, Thead, Tr, Th, Tbody, Td, Textarea, useToast } from '@chakra-ui/react'
import Navbar from '../components/Navbar'
import Card from '../components/Card'
import LoadingSpinner from '../components/LoadingSpinner'
import { apiClient } from '../utils/api'
import { useAuth } from '../context/AuthContext'

export default function TemplatesPage() {
  const [templates, setTemplates] = useState([])
  const [name, setName] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const toast = useToast()
  const { user } = useAuth()

  const load = async () => {
    try {
      setLoading(true)
      const res = await apiClient.get('/api/templates')
      setTemplates(res.data?.templates || [])
    } catch (e) {
      toast({ title: 'Error', description: e.message || 'Failed to load templates', status: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const createTemplate = async () => {
    if (!name.trim() || !content.trim()) return
    try {
      const res = await apiClient.post('/api/templates', { name, content })
      setTemplates((prev) => [res.data, ...prev])
      setName(''); setContent('')
      toast({ title: 'Template created', status: 'success' })
    } catch (e) {
      toast({ title: 'Error', description: e.message || 'Failed to create template', status: 'error' })
    }
  }

  useEffect(() => { load() }, [])

  return (
    <Box>
      <Navbar />
      <Container maxW="6xl" py={8}>
        <Heading mb={6}>Templates</Heading>
        {user?.role === 'admin' && (
          <Card>
            <VStack align="stretch" spacing={4}>
              <FormControl>
                <FormLabel>Template Name</FormLabel>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="NDA" />
              </FormControl>
              <FormControl>
                <FormLabel>Content</FormLabel>
                <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Template body..." rows={8} />
              </FormControl>
              <HStack>
                <Button onClick={createTemplate} colorScheme="purple">Create</Button>
              </HStack>
            </VStack>
          </Card>
        )}

        <Card>
          {loading ? (
            <LoadingSpinner />
          ) : (
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Name</Th>
                  <Th>Version</Th>
                  <Th>Created</Th>
                </Tr>
              </Thead>
              <Tbody>
                {templates.length === 0 ? (
                  <Tr><Td colSpan={3}>No templates yet</Td></Tr>
                ) : templates.map((t) => (
                  <Tr key={t.id}>
                    <Td>{t.name}</Td>
                    <Td>{t.version}</Td>
                    <Td>{t.created_at}</Td>
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
