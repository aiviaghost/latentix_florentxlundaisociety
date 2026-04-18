import { useState } from 'react'
import api from '../api/client'

function useSociety() {
  const [society, setSociety] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const generateSociety = async (config) => {
    setLoading(true)
    setError(null)

    try {
      const response = await api.generateSociety(config)
      setSociety(response)
      return response
    } catch (err) {
      setError(err.message || 'Failed to generate society')
      console.error('Error generating society:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const resetSociety = () => {
    setSociety(null)
    setError(null)
  }

  return {
    society,
    loading,
    error,
    generateSociety,
    resetSociety,
  }
}

export default useSociety
