import React, { useState, useEffect } from 'react'
import { useSettings } from '@/features/settings/hooks/useSettings'
import { useImageUpload } from '@/features/settings/hooks/useImageUpload'
import { CurrencySettings } from '@/features/settings/components/CurrencySettings'
import { NotificationSettings } from '@/features/settings/components/NotificationSettings'
import { ImageSettings } from '@/features/settings/components/ImageSettings'
import { BannerLinkSection } from '@/features/settings/components/BannerLinkSection'
import { HeroLinkSection } from '@/features/settings/components/HeroLinkSection'
import { se } from 'date-fns/locale'
import axios from 'axios'
import { toast } from "sonner"
import { backendUrl } from '@/lib/utils'

const Settings = ({ token }) => {
  const { updateSettings } = useSettings(token)

  // Initialize settings with default values
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
    },
    legal: {
      privacyPolicy: '',
      termsAndConditions: ''
    }
  })

  // Add new state for products and categories
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState({})

  const [isLoading, setIsLoading] = useState(false)
  const [bannerText, setBannerText] = useState('')
  const [linkType, setLinkType] = useState('product')
  const [selectedLink, setSelectedLink] = useState({
    productId: '',
    category: '',
    subcategory: '',
    subsubcategory: ''
  })

  // Add useEffect to fetch initial settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await axios.get(`${backendUrl}/api/settings`, {
          headers: { token }
        })
        console.log('Fetched settings:', response.data)
        if (response.data.success) {
          // Ensure legal field exists
          const settingsData = {
            ...response.data.settings,
            legal: response.data.settings.legal || {
              privacyPolicy: '',
              termsAndConditions: ''
            }
          }
          setSettings(settingsData)
          setBannerText(response.data.settings.text?.banner || '')
          // Set initial link type based on existing settings
          setLinkType(response.data.settings.link?.productId ? 'product' : 'category')
          setSelectedLink({
            productId: response.data.settings.link?.productId || '',
            category: response.data.settings.link?.category || '',
            subcategory: response.data.settings.link?.subcategory || '',
            subsubcategory: response.data.settings.link?.subsubcategory || ''
          })
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error)
        toast.error('Failed to load settings')
      }
    }

    fetchSettings()
  }, [token])

  // Add new useEffect to fetch products and categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          axios.get(`${backendUrl}/api/product/list`),
          axios.get(`${backendUrl}/api/categories`)
        ]);

        console.log('Fetched products:', productsRes.data)
        console.log('Fetched categories:', categoriesRes.data)  

        if (productsRes.data.success) {
          setProducts(productsRes.data.products)
        }
        if (categoriesRes.data.success) {
          setCategories(categoriesRes.data.categories)
        }
      } catch (error) {
        console.error('Failed to fetch products/categories:', error)
        toast.error('Failed to load products and categories')
      }
    }

    fetchData()
  }, []) // Empty dependency array since we only need to fetch once

  const {
    heroFiles,
    bannerFile,
    handleHeroImagesChange,
    handleBannerImageChange
  } = useImageUpload()

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      setIsLoading(true)
      const formData = new FormData()
      // Handle currency updates
      formData.append('currency', JSON.stringify({
        name: settings.currency?.name || '',
        sign: settings.currency?.sign || ''
      }))

      // Handle email updates
      formData.append('email', JSON.stringify({
        notifications: settings.email?.notifications || ''
      }))
      
      // Handle text updates
      formData.append('text', JSON.stringify({
        banner: bannerText,
        hero: settings.text?.hero || ''
      }))
      
      // Handle link updates
      formData.append('link', JSON.stringify({
        productId: settings.link?.productId || '',
        category: settings.link?.category || '',
        subcategory: settings.link?.subcategory || '',
        subsubcategory: settings.link?.subsubcategory || ''
      }))

      // Handle hero link updates
      formData.append('herolink', JSON.stringify({
        productId: settings.herolink?.productId || '',
        category: settings.herolink?.category || '',
        subcategory: settings.herolink?.subcategory || '',
        subsubcategory: settings.herolink?.subsubcategory || ''
      }))

      // Handle legal documents
      formData.append('legal', JSON.stringify({
        privacyPolicy: settings.legal?.privacyPolicy || '',
        termsAndConditions: settings.legal?.termsAndConditions || ''
      }))

      // Handle image uploads
      heroFiles.forEach(file => {
        formData.append('hero', file)
      })
      
      // Handle banner image
      if (bannerFile) {
        formData.append('banner', bannerFile)
      }

      // Debug: Log what we're sending
      console.log('Sending form data:')
      for (let [key, value] of formData.entries()) {
        console.log(key, value)
      }

      const response = await axios.put(`${backendUrl}/api/settings`, formData, {
        headers: { 
          token,
          'Content-Type': 'multipart/form-data'
        }
      })

      if (response.data.success) {
        setSettings(response.data.settings)
        toast.success('Settings updated successfully')
      }
    } catch (error) {
      console.error('Failed to update settings:', error)
      toast.error('Failed to update settings')
    } finally {
      setIsLoading(false)
    }
  }

  // Update HeroLinkSection props
  return (
    <div className="p-4 sm:p-6 max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        <CurrencySettings 
          settings={settings} 
          onSettingsChange={setSettings} 
        />
        
        <NotificationSettings 
          settings={settings} 
          onSettingsChange={setSettings} 
        />

        <HeroLinkSection 
          settings={settings}
          onSettingsChange={setSettings}
          heroText={settings.text?.hero || ''}
          onHeroTextChange={(value) => setSettings(prev => ({
            ...prev,
            text: { ...(prev.text || {}), hero: value }
          }))}
          heroLinkType={settings.herolink?.productId ? 'product' : 'category'}
          onHeroLinkTypeChange={(value) => {
            const newHeroLink = value === 'product' 
              ? { productId: '', category: '', subcategory: '', subsubcategory: '' }
              : { productId: '', category: '', subcategory: '', subsubcategory: '' }
            setSettings(prev => ({
              ...prev,
              herolink: newHeroLink
            }))
          }}
          selectedHeroLink={settings.herolink || {}}
          onHeroLinkChange={(field, value) => setSettings(prev => ({
            ...prev,
            herolink: { ...(prev.herolink || {}), [field]: value }
          }))}
          products={products}
          categories={categories}
        />
        
        <ImageSettings 
          settings={settings}
          onSettingsChange={setSettings}
          heroFiles={heroFiles}
          bannerFile={bannerFile}
          onHeroImagesChange={handleHeroImagesChange}
          onBannerImageChange={handleBannerImageChange}
        />

        <BannerLinkSection 
          settings={settings}
          onSettingsChange={setSettings}
          bannerText={bannerText}
          onBannerTextChange={setBannerText}
          linkType={linkType}
          onLinkTypeChange={setLinkType}
          selectedLink={selectedLink}
          onLinkChange={(field, value) => setSelectedLink(prev => ({ ...prev, [field]: value }))}
          products={products}
          categories={categories}
        />

        {/* Legal Documents Section */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">Legal Documents</h3>

          {/* Privacy Policy */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Privacy Policy
            </label>
            <textarea
              value={settings.legal?.privacyPolicy || ''}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                legal: { ...(prev.legal || {}), privacyPolicy: e.target.value }
              }))}
              rows={10}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-vertical"
              placeholder="Enter your privacy policy content here..."
            />
            <p className="text-xs text-gray-500 mt-1">
              This will be displayed to users when they view the privacy policy.
            </p>
          </div>

          {/* Terms and Conditions */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Terms and Conditions
            </label>
            <textarea
              value={settings.legal?.termsAndConditions || ''}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                legal: { ...(prev.legal || {}), termsAndConditions: e.target.value }
              }))}
              rows={10}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-vertical"
              placeholder="Enter your terms and conditions content here..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Users will be required to accept these terms during signup.
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="mt-6 w-full sm:w-auto px-6 py-2 bg-black text-white rounded-lg 
                   hover:bg-gray-800 disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  )
}

export default Settings