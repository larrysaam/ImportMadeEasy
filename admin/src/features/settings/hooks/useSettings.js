import { useState, useEffect } from 'react'
import axios from 'axios'
import { toast } from 'sonner'
import { backendUrl } from '@/App'

export const useSettings = (token) => {
  const [settings, setSettings] = useState({
    currency: { name: '', sign: '' },
    email: { notifications: '' },
    images: { hero: [], banner: '' },
    text: { banner: '', hero: '' },
    link: {
      productId: '',
      category: '',
      subcategory: '',
      subsubcategory: ''
    },
    herolink: {
      productId: '',
      category: '',
      subcategory: '',
      subsubcategory: ''
    }
  })
  const [isLoading, setIsLoading] = useState(false)

  const updateSettings = async (formData) => {
    setIsLoading(true)
    try {
      const response = await axios.put(`${backendUrl}/api/settings`, formData, {
        headers: { 
          token,
          'Content-Type': 'multipart/form-data'
        }
      })

      if (!response.data.success) {
        throw new Error('Failed to update settings')
      }

      return response.data
    } catch (error) {
      console.error('Settings update error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  return {
    settings,
    setSettings,
    isLoading,
    updateSettings
  }
}