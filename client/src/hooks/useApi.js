import { useState, useCallback } from 'react'
import { useToast } from '@chakra-ui/react'
import apiClient from '../utils/api'

/**
 * Custom hook for API calls with loading, error, and success states
 * @param {Function} apiFunction - The API function to call
 * @param {Object} options - Configuration options
 */
export function useApi(apiFunction, options = {}) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const toast = useToast()

  const {
    onSuccess = null,
    onError = null,
    successMessage = null,
    errorMessage = 'An error occurred',
    showSuccessToast = false,
    showErrorToast = true
  } = options

  const execute = useCallback(async (...args) => {
    try {
      setLoading(true)
      setError(null)

      const result = await apiFunction(...args)

      setData(result)

      if (showSuccessToast && successMessage) {
        toast({
          title: 'Success',
          description: successMessage,
          status: 'success',
          duration: 3000,
          isClosable: true,
        })
      }

      if (onSuccess) {
        onSuccess(result)
      }

      return result
    } catch (err) {
      const errorMsg = err.message || errorMessage
      setError(errorMsg)

      if (showErrorToast) {
        toast({
          title: 'Error',
          description: errorMsg,
          status: 'error',
          duration: 5000,
          isClosable: true,
        })
      }

      if (onError) {
        onError(err)
      }

      throw err
    } finally {
      setLoading(false)
    }
  }, [apiFunction, onSuccess, onError, successMessage, errorMessage, showSuccessToast, showErrorToast, toast])

  const reset = useCallback(() => {
    setData(null)
    setError(null)
    setLoading(false)
  }, [])

  return {
    data,
    loading,
    error,
    execute,
    reset
  }
}

/**
 * Hook for fetching data on component mount
 */
export function useFetch(url, options = {}) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const { skip = false, onSuccess = null } = options

  const refetch = useCallback(async () => {
    if (skip) return

    try {
      setLoading(true)
      setError(null)

      const result = await apiClient.get(url)

      setData(result)

      if (onSuccess) {
        onSuccess(result)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [url, skip, onSuccess])

  // Initial fetch
  useState(() => {
    refetch()
  }, [refetch])

  return {
    data,
    loading,
    error,
    refetch
  }
}

export default useApi
