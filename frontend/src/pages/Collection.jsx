import React, { useContext, useEffect, useState } from 'react'
import { ShopContext } from '@/context/ShopContext'
import Title from '@/components/Title'
import ProductItem from '@/features/shared/ProductItem'
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { assets } from '@/assets/assets'
import { CollectionSkeleton } from '@/features/collection/CollectionSkeleton'
import { useSearchParams } from 'react-router-dom'
import ScrollToTop from '@/components/ScrollToTop'

const Collection = () => {
  const { products, search, showSearch, isLoading } = useContext(ShopContext)
  const [searchParams] = useSearchParams()
  const category = searchParams.get('category')
  const subcategory = searchParams.get('subcategory')

  // State for filters
  const [showFilter, setShowFilter] = useState(false)
  const [filterProducts, setFilterProducts] = useState(products || [])
  const [selectedCategory, setSelectedCategory] = useState([])
  const [selectedSubCategory, setSelectedSubCategory] = useState([])
  const [sortType, setSortType] = useState('relevant')
  const [bestsellerOnly, setBestsellerOnly] = useState(false) // Bestseller filter
  const [availableSubcategories, setAvailableSubcategories] = useState([])
  const [preorderOnly, setPreorderOnly] = useState(false)
  const [selectedCountry, setSelectedCountry] = useState(() => {
    // Initialize from localStorage or default to empty string
    return localStorage.getItem('selectedCountry') || ''
  }) // Country filter
  const isPreorder = searchParams.get('preorder') === 'true'

  // Custom function to update country and persist to localStorage
  const updateSelectedCountry = (country) => {
    setSelectedCountry(country)
    if (country) {
      localStorage.setItem('selectedCountry', country)
    } else {
      localStorage.removeItem('selectedCountry')
    }
  }


  const flagImages = {
    Nigeria: "https://flagcdn.com/w320/ng.png",
    China: "https://flagcdn.com/w320/cn.png"
  }

  // Toggle category filter
  const toggleCategory = (value) => {
    setSelectedCategory(prev => prev.includes(value) ? prev.filter(item => item !== value) : [...prev, value])
  }

  // Toggle subcategory filter
  const toggleSubCategory = (value) => {
    setSelectedSubCategory(prev => prev.includes(value) ? prev.filter(item => item !== value) : [...prev, value])
  }

  // Update available subcategories based on selected categories
  const updateAvailableSubcategories = () => {
    if (selectedCategory.length === 0) {
      // If no category is selected, show all unique subcategories
      const allSubcategories = [...new Set(products.map(item => item.subcategory))]
      setAvailableSubcategories(allSubcategories)
    } else {
      // Show subcategories only for selected categories
      const filteredSubcategories = [...new Set(
        products
          .filter(item => selectedCategory
            .map(cat => cat.toLowerCase())
            .includes(item.category.toLowerCase()))
          .map(item => item.subcategory)
      )]
      setAvailableSubcategories(filteredSubcategories)
    }
  }

  // Apply filters to products
  const applyFilter = () => {
    let filtered = products;

    // Only apply preorder filter if preorderOnly is true
    if (preorderOnly) {
      filtered = filtered.filter(item => item.preorder === true)
    }

    // Search filter - search by name and keywords
    if (showSearch && search) {
      const searchTerm = search.toLowerCase()
      filtered = filtered.filter(item => {
        // Search in product name
        const nameMatch = item.name.toLowerCase().includes(searchTerm)

        // Search in keywords array
        const keywordMatch = item.keywords && Array.isArray(item.keywords)
          ? item.keywords.some(keyword =>
              keyword.toLowerCase().includes(searchTerm)
            )
          : false

        // Return true if either name or keywords match
        return nameMatch || keywordMatch
      })
    }

    // Category filter
    if (selectedCategory.length > 0) {
      filtered = filtered.filter(item =>
        selectedCategory.map(cat => cat.toLowerCase())
          .includes(item.category.toLowerCase())
      )
    }

    // Subcategory filter
    if (selectedSubCategory.length > 0) {
      filtered = filtered.filter(item =>
        selectedSubCategory.map(subCat => subCat.toLowerCase())
          .includes(item.subcategory.toLowerCase())
      )
    }

    // Bestseller filter
    if (bestsellerOnly) {
      filtered = filtered.filter(item => item.bestseller)
    }

    // Country filter
    if (selectedCountry) {
      filtered = filtered.filter(item =>
        item.countryOfOrigin && item.countryOfOrigin.toLowerCase() === selectedCountry.toLowerCase()
      )
    }

    // Randomize the order of filtered products
    const shuffled = [...filtered].sort(() => Math.random() - 0.5)
    setFilterProducts(shuffled)
    // No pagination needed - show all filtered products
  }

  // Sort products
  const sortProduct = () => {
    let sorted = [...filterProducts];

    switch (sortType) {
      case 'low-high':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'high-low':
        sorted.sort((a, b) => b.price - a.price);
        break;
      default:
        applyFilter(); // Reset filter if "relevant"
        return;
    }

    setFilterProducts(sorted);
  }

  // Run filter logic when dependencies change
  useEffect(() => {
    applyFilter()
  }, [selectedCategory, selectedSubCategory, search, showSearch, products, bestsellerOnly, preorderOnly, selectedCountry])

  useEffect(() => {
    sortProduct()
  }, [sortType])

  useEffect(() => {
    if (category && subcategory) {
      // Filter your products based on category and subcategory
      setSelectedCategory([category])
      setSelectedSubCategory([subcategory])
    }
  }, [category, subcategory])

  // Add new useEffect
  useEffect(() => {
    updateAvailableSubcategories()
  }, [selectedCategory, products])

  // Update initial state
  useEffect(() => {
    if (isPreorder) {
      setPreorderOnly(true)
    }
  }, [isPreorder])

  // Update preorder checkbox handler
  const handlePreorderChange = (checked) => {
    setPreorderOnly(checked)
    const newParams = new URLSearchParams(searchParams)
    if (checked) {
      newParams.set('preorder', 'true')
    } else {
      newParams.delete('preorder')
    }
    window.history.pushState({}, '', checked ? `?${newParams.toString()}` : window.location.pathname)
  }



  return (
    <div className='flex flex-col px-0 sm:px-3 md:px-6 md:flex-row gap-1 sm:gap-10 pt-4 sm:pt-10 border-t animate-fade animate-duration-500 bg-gray-50 sm:bg-white min-h-screen'>
      {/* Mobile Filter Header */}
      <div className='min-w-60'>
        {/* Mobile Header - Enhanced with modern card design */}
        <div className="md:hidden mb-4">
          {/* Mobile Control Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-4">
            {/* Top Row - Filters and Sort */}
            <div className="flex items-center justify-between gap-3">
              {/* FILTERS Dropdown - Enhanced */}
              <button
                onClick={() => setShowFilter(!showFilter)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300 ${
                  showFilter
                    ? 'bg-brand text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
                </svg>
                FILTERS
                <svg
                  className={`w-3 h-3 transition-transform duration-300 ${showFilter ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Sort Dropdown - Enhanced */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600 font-medium">Sort:</span>
                <Select defaultValue='relevant' onValueChange={setSortType}>
                  <SelectTrigger className="w-[110px] h-9 text-xs border border-gray-200 rounded-lg bg-white hover:border-gray-300 transition-colors">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg border-gray-200">
                    <SelectItem value="relevant" className="text-xs rounded-md">Relevant</SelectItem>
                    <SelectItem value="low-high" className="text-xs rounded-md">Low-High</SelectItem>
                    <SelectItem value="high-low" className="text-xs rounded-md">High-Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Country Filter Section - Enhanced */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium text-gray-700">Country Filter</span>
              </div>

              <div className="flex items-center gap-2">
                {/* All Countries Button - Enhanced */}
                <button
                  onClick={() => updateSelectedCountry('')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-300 ${
                    selectedCountry === ''
                      ? 'bg-brand text-white shadow-md ring-2 ring-brand/20'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  title="All Countries"
                >
                  <span className="text-sm">🌍</span>
                  <span className="hidden sm:inline">All</span>
                </button>

                {/* Nigeria Flag Button - Enhanced */}
                <button
                  onClick={() => updateSelectedCountry('Nigeria')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-300 ${
                    selectedCountry === 'Nigeria'
                      ? 'bg-green-50 text-green-800 ring-2 ring-green-500 shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  title="Nigeria"
                >
                  <div className="w-5 h-5 rounded-full overflow-hidden border border-white shadow-sm">
                    <img src={flagImages.Nigeria} alt="Nigeria Flag" className="w-full h-full object-cover"/>
                  </div>
                  <span className="hidden sm:inline">NG</span>
                </button>

                {/* China Flag Button - Enhanced */}
                <button
                  onClick={() => updateSelectedCountry('China')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-300 ${
                    selectedCountry === 'China'
                      ? 'bg-red-50 text-red-800 ring-2 ring-red-500 shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  title="China"
                >
                  <div className="w-5 h-5 rounded-full overflow-hidden border border-white shadow-sm">
                    <img src={flagImages.China} alt="China Flag" className="w-full h-full object-cover"/>
                  </div>
                  <span className="hidden sm:inline">CN</span>
                </button>
              </div>
            </div>

            {/* Active Filters Display */}
            {(selectedCountry || bestsellerOnly) && (
              <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                <span className="text-xs text-gray-600 font-medium">Active:</span>
                {selectedCountry && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    {selectedCountry}
                    <button
                      onClick={() => updateSelectedCountry('')}
                      className="hover:bg-blue-200 rounded-full p-0.5"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                )}
                {bestsellerOnly && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                    Bestsellers
                    <button
                      onClick={() => setBestsellerOnly(false)}
                      className="hover:bg-yellow-200 rounded-full p-0.5"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Desktop Header - Keep original structure for desktop */}
        <div className="hidden md:block">
          <p className='my-2 text-xl font-medium'>FILTERS</p>
        </div>

        {/* Enhanced Filter Sections */}
        <div className={`${showFilter ? 'block' : 'hidden'} md:block space-y-4`}>
          {/* Category Filter - Enhanced Mobile */}
          <div className={`${showFilter ? 'block' : 'hidden'} md:block`}>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:border-gray-300 md:rounded-none md:shadow-none md:bg-transparent">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-4 h-4 text-gray-600 md:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <p className='text-sm font-semibold tracking-wide text-gray-800 md:text-xs md:font-medium'>CATEGORIES</p>
              </div>
              <div className='flex flex-col gap-3 text-sm font-light text-gray-700'>
                {["Men", "Women", "Kids"].map(cat => (
                  <div key={cat} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 md:hover:bg-transparent md:p-0 transition-colors">
                    <Checkbox
                      id={cat}
                      onCheckedChange={() => toggleCategory(cat)}
                      checked={selectedCategory.includes(cat)}
                      className="data-[state=checked]:bg-brand data-[state=checked]:border-brand"
                    />
                    <label htmlFor={cat} className="text-sm leading-relaxed cursor-pointer font-medium md:font-light flex-1">
                      {cat}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Country of Origin Filter - Enhanced Mobile */}
          <div className={`${showFilter ? 'block' : 'hidden'} md:block`}>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:border-gray-300 md:rounded-none md:shadow-none md:bg-transparent">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-4 h-4 text-gray-600 md:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className='text-sm font-semibold tracking-wide text-gray-800 md:text-xs md:font-medium'>COUNTRY OF ORIGIN</p>
              </div>
              <div className='flex flex-col gap-2 text-sm font-light text-gray-700'>
                {/* All Countries Option - Enhanced */}
                <div
                  className={`flex items-center space-x-3 p-3 rounded-xl cursor-pointer transition-all duration-300 md:p-2 md:rounded-md ${
                    selectedCountry === ''
                      ? 'bg-gradient-to-r from-brand/10 to-brand/5 border-2 border-brand/30 shadow-sm'
                      : 'hover:bg-gray-50 border border-transparent'
                  }`}
                  onClick={() => updateSelectedCountry('')}
                >
                  <div className="w-8 h-8 md:w-6 md:h-6 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center text-sm shadow-sm">
                    🌍
                  </div>
                  <span className={`font-medium ${selectedCountry === '' ? 'text-brand' : 'text-gray-700'}`}>
                    All Countries
                  </span>
                  {selectedCountry === '' && (
                    <svg className="w-4 h-4 text-brand ml-auto md:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>

                {/* Nigeria Option - Enhanced */}
                <div
                  className={`flex items-center space-x-3 p-3 rounded-xl cursor-pointer transition-all duration-300 md:p-2 md:rounded-md ${
                    selectedCountry === 'Nigeria'
                      ? 'bg-gradient-to-r from-green-50 to-green-25 border-2 border-green-300 shadow-sm'
                      : 'hover:bg-gray-50 border border-transparent'
                  }`}
                  onClick={() => updateSelectedCountry('Nigeria')}
                >
                  <div className="w-8 h-8 md:w-6 md:h-6 rounded-full overflow-hidden border-2 border-white shadow-md">
                    <img src={flagImages.Nigeria} alt="Nigeria Flag" className="w-full h-full object-cover"/>
                  </div>
                  <span className={`font-medium ${selectedCountry === 'Nigeria' ? 'text-green-800' : 'text-gray-700'}`}>
                    Nigeria
                  </span>
                  {selectedCountry === 'Nigeria' && (
                    <svg className="w-4 h-4 text-green-600 ml-auto md:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>

                {/* China Option - Enhanced */}
                <div
                  className={`flex items-center space-x-3 p-3 rounded-xl cursor-pointer transition-all duration-300 md:p-2 md:rounded-md ${
                    selectedCountry === 'China'
                      ? 'bg-gradient-to-r from-red-50 to-red-25 border-2 border-red-300 shadow-sm'
                      : 'hover:bg-gray-50 border border-transparent'
                  }`}
                  onClick={() => updateSelectedCountry('China')}
                >
                  <div className="w-8 h-8 md:w-6 md:h-6 rounded-full overflow-hidden border-2 border-white shadow-md">
                    <img src={flagImages.China} alt="China Flag" className="w-full h-full object-cover"/>
                  </div>
                  <span className={`font-medium ${selectedCountry === 'China' ? 'text-red-800' : 'text-gray-700'}`}>
                    China
                  </span>
                  {selectedCountry === 'China' && (
                    <svg className="w-4 h-4 text-red-600 ml-auto md:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Subcategory Filter */}
          {/* <div className={`border border-gray-300 pl-5 py-3 my-5 ${showFilter ? '' : 'hidden'} md:block`}>
            <p className='mb-3 text-xs sm:text-sm font-medium tracking-wide'>TYPE</p>
            <div className='flex flex-col gap-3 text-sm font-light text-gray-700'>
              {availableSubcategories.map(subCat => (
                <div key={subCat} className="items-center flex space-x-2">
                  <Checkbox 
                    id={subCat} 
                    onCheckedChange={() => toggleSubCategory(subCat)} 
                    checked={selectedSubCategory.includes(subCat)}
                  />
                  <label
                    htmlFor={subCat}
                    className="text-sm leading-relaxed capitalize cursor-pointer"
                  >
                    {subCat}
                  </label>
                </div>
              ))}
            </div>
            {availableSubcategories.length === 0 && (
              <p className="text-xs sm:text-sm text-gray-500 italic leading-relaxed">
                Select a category to see available types
              </p>
            )}
          </div> */}

          {/* Bestseller Filter - Enhanced Mobile */}
          <div className={`${showFilter ? 'block' : 'hidden'} md:block`}>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:border-gray-300 md:rounded-none md:shadow-none md:bg-transparent">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-4 h-4 text-gray-600 md:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                <p className='text-sm font-semibold tracking-wide text-gray-800 md:text-xs md:font-medium'>EXTRAS</p>
              </div>
              <div className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-300 md:p-0 md:rounded-none md:space-x-2 ${
                bestsellerOnly ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200' : 'hover:bg-gray-50 md:hover:bg-transparent'
              }`}>
                <Checkbox
                  id="Bestseller"
                  onCheckedChange={() => setBestsellerOnly(!bestsellerOnly)}
                  checked={bestsellerOnly}
                  className="data-[state=checked]:bg-yellow-500 data-[state=checked]:border-yellow-500"
                />
                <label htmlFor="Bestseller" className="text-sm leading-relaxed cursor-pointer font-medium md:font-light flex-1 flex items-center gap-2">
                  Bestsellers
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full md:hidden">⭐ Popular</span>
                </label>
              </div>
            </div>
          </div>

          {/* Preorder Filter */}
          {/* <div className={`border border-gray-300 pl-5 py-3 mt-6 hidden md:block`}>
            <p className='mb-3 text-xs sm:text-sm font-medium tracking-wide'>PRODUCT TYPE</p>
            <div className="items-center flex space-x-2">
              <Checkbox 
                id="Preorder" 
                onCheckedChange={handlePreorderChange}
                checked={preorderOnly}
              />
              <label htmlFor="Preorder" className="text-sm leading-relaxed font-light cursor-pointer">
                Pre-order Only
              </label>
            </div>
          </div> */}
        </div>
      </div>

      {/* Products Section - Enhanced Mobile */}
      <div className='flex-1 bg-white md:bg-transparent rounded-t-3xl md:rounded-none -mt-4 md:mt-0 pt-6 md:pt-0 px-3 md:px-0'>
        {/* Header Section */}
        <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4 mb-6'>
          {/* Enhanced Title for Mobile */}
          <div className="text-center md:text-left">
            <Title
              text1={isPreorder ? 'PRE' : (selectedCountry ? selectedCountry.toUpperCase() : 'ALL')}
              text2={isPreorder ? 'ORDERS' : 'COLLECTIONS'}
            />
            {/* Mobile subtitle */}
            <div className="md:hidden mt-2">
              {/* {selectedCountry && (
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                  <div className="w-4 h-4 rounded-full overflow-hidden">
                    <img
                      src={selectedCountry === 'Nigeria' ? flagImages.Nigeria : flagImages.China}
                      alt={`${selectedCountry} Flag`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span>Products from {selectedCountry}</span>
                </div>
              )} */}
              {bestsellerOnly && (
                <div className="flex items-center justify-center gap-1 text-sm text-yellow-700 mt-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
                  </svg>
                  <span>Bestsellers Only</span>
                </div>
              )}
            </div>
          </div>

          {/* Product Sort Dropdown - Desktop Only */}
          <div className='hidden md:flex items-center gap-2'>
            <span className='text-sm text-gray-600'>Sort by:</span>
            <Select defaultValue='relevant' onValueChange={setSortType} className='border-2 border-gray-300 text-sm px-2'>
              <SelectTrigger className="w-[160px] lg:w-[180px] text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevant" className="text-sm">Relevant</SelectItem>
                <SelectItem value="low-high" className="text-sm">Low to High</SelectItem>
                <SelectItem value="high-low" className="text-sm">High to Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Product Grid - Enhanced Mobile */}
        {isLoading ? <CollectionSkeleton /> : (
          <div>
           
            {/* Enhanced Product Grid */}
            <div className='grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 sm:gap-4 gap-y-6 sm:gap-y-14 pb-8 md:pb-0'>
              {filterProducts.map((item, index) => (
                <div
                  key={item._id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <ProductItem
                    id={item._id}
                    name={item.name}
                    price={item.price}
                    image={item.image}
                  />
                </div>
              ))}
            </div>

            {/* Enhanced No Results */}
            {!filterProducts.length && (
              <div className='text-center py-12 px-4'>
                <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className='text-lg font-semibold text-gray-800 mb-2'>No products found</h3>
                <p className='text-sm text-gray-600 mb-4 max-w-sm mx-auto'>
                  We couldn't find any products matching your current filters. Try adjusting your search criteria.
                </p>
                <button
                  onClick={() => {
                    setSelectedCategory([])
                    setSelectedSubCategory([])
                    setBestsellerOnly(false)
                    updateSelectedCountry('')
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand/90 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Clear all filters
                </button>
              </div>
            )}

          </div>
        )}
      </div>

      {/* Scroll to Top Button */}
      <ScrollToTop />
    </div>
  )
}

export default Collection
