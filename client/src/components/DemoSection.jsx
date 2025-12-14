import { useState } from 'react'
import { Upload, FileText, Send, Loader2, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function DemoSection() {
  const { user, token } = useAuth()
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [documentData, setDocumentData] = useState(null)
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState([])
  const [questionsRemaining, setQuestionsRemaining] = useState(user ? 99999 : 5)
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile)
      setError('')
    } else {
      setError('Please select a valid PDF file')
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setError('')

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData
      })
      
      if (!response.ok) throw new Error('Failed to upload')
      
      const data = await response.json()
      setDocumentData(data)
      setQuestionsRemaining(user ? 99999 : 5)
      setMessages([])
    } catch (err) {
      setError(err.message || 'Failed to upload document')
    } finally {
      setUploading(false)
    }
  }

  const handleSendQuestion = async () => {
    if (!question.trim() || !documentData || questionsRemaining <= 0) return

    setSending(true)
    const userQuestion = question
    setQuestion('')
    setMessages(prev => [...prev, { type: 'user', content: userQuestion }])

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          document_id: documentData.document_id,
          question: userQuestion,
          session_id: documentData.session_id
        })
      })
      
      if (!response.ok) throw new Error('Failed to get response')
      
      const data = await response.json()
      setMessages(prev => [...prev, { type: 'ai', content: data.answer }])
      setQuestionsRemaining(data.questions_remaining)
    } catch (err) {
      const errorMsg = err.message || 'Failed to get response'
      setMessages(prev => [...prev, { type: 'error', content: errorMsg }])
    } finally {
      setSending(false)
    }
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-center text-navy-900 mb-8">
          Try Our Demo
        </h2>

        {!documentData ? (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Upload a PDF document to analyze</p>
              
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
                id="pdf-upload"
              />
              <label
                htmlFor="pdf-upload"
                className="inline-block bg-navy-800 hover:bg-navy-700 text-white px-6 py-3 rounded-lg cursor-pointer transition"
              >
                Select PDF
              </label>

              {file && (
                <div className="mt-4">
                  <div className="flex items-center justify-center space-x-2 text-navy-700">
                    <FileText className="h-5 w-5" />
                    <span>{file.name}</span>
                  </div>
                  <button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="mt-4 bg-gold-500 hover:bg-gold-600 text-navy-900 px-8 py-3 rounded-lg font-medium transition disabled:opacity-50"
                  >
                    {uploading ? (
                      <span className="flex items-center space-x-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Processing...</span>
                      </span>
                    ) : (
                      'Analyze Document'
                    )}
                  </button>
                </div>
              )}

              {error && (
                <div className="mt-4 flex items-center justify-center space-x-2 text-red-600">
                  <AlertCircle className="h-5 w-5" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-navy-900 mb-4 flex items-center space-x-2">
                <FileText className="h-6 w-6 text-gold-500" />
                <span>Document Summary: {documentData.filename}</span>
              </h3>
              <ul className="space-y-2">
                {documentData.summary.map((point, index) => (
                  <li key={index} className="flex items-start space-x-2 text-gray-700">
                    <span className="text-gold-500 font-bold">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-navy-900">Ask Questions</h3>
                <span className={`text-sm px-3 py-1 rounded-full ${
                  questionsRemaining > 2 ? 'bg-green-100 text-green-700' : 
                  questionsRemaining > 0 ? 'bg-yellow-100 text-yellow-700' : 
                  'bg-red-100 text-red-700'
                }`}>
                  {questionsRemaining} questions remaining
                </span>
              </div>

              <div className="h-64 overflow-y-auto border border-gray-200 rounded-lg p-4 mb-4 space-y-4">
                {messages.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">
                    Ask a question about your document...
                  </p>
                ) : (
                  messages.map((msg, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg ${
                        msg.type === 'user' 
                          ? 'bg-navy-100 ml-8' 
                          : msg.type === 'error'
                          ? 'bg-red-50 text-red-700'
                          : 'bg-gray-100 mr-8'
                      }`}
                    >
                      <p className="text-sm font-medium mb-1">
                        {msg.type === 'user' ? 'You' : msg.type === 'error' ? 'Error' : 'AI Assistant'}
                      </p>
                      <p className="text-gray-700 whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="flex space-x-2">
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendQuestion()}
                  placeholder={questionsRemaining > 0 ? "Ask about the document..." : "Demo limit reached"}
                  disabled={questionsRemaining <= 0 || sending}
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gold-500 disabled:bg-gray-100"
                />
                <button
                  onClick={handleSendQuestion}
                  disabled={questionsRemaining <= 0 || !question.trim() || sending}
                  className="bg-gold-500 hover:bg-gold-600 text-navy-900 px-4 py-2 rounded-lg transition disabled:opacity-50"
                >
                  {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              onClick={() => {
                setDocumentData(null)
                setFile(null)
                setMessages([])
                setQuestionsRemaining(5)
              }}
              className="w-full text-center text-navy-600 hover:text-navy-800 underline"
            >
              Upload a different document
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
