import { useState, useEffect } from 'react'
import axios from 'axios'

export const useSettings = () => {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/settings/user`)
        if (response.data.success) {
            console.log('Settings fetched successfully:', response.data.settings)
          setSettings(response.data.settings)
        }
      } catch (error) {
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [])

  return { settings, loading, error }
}