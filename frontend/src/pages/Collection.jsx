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
  const [selectedCountry, setSelectedCountry] = useState('') // Country filter
  const isPreorder = searchParams.get('preorder') === 'true'


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

    setFilterProducts(filtered)
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
    <div className='flex flex-col px-3 sm:px-4 md:px-8 md:flex-row gap-1 sm:gap-10 pt-6 sm:pt-10 border-t animate-fade animate-duration-500'>
      {/* Mobile Filter Header */}
      <div className='min-w-60'>
        {/* Mobile Header - Filters, Sort, and Country Flags in one row */}
        <div className="flex items-center justify-between gap-3 md:hidden">
          {/* FILTERS Dropdown */}
          <p onClick={() => setShowFilter(!showFilter)} className='flex items-center cursor-pointer gap-2 font-medium text-sm'>
            FILTERS
            <img
              src={assets.arrow}
              alt='dropdown-icon'
              className={`fill-gray-500 transition-all duration-200 h-3 rotate-270 ${showFilter ? 'rotate-180' : ''}`}
            />
          </p>

          {/* Sort Dropdown - Mobile */}
          <div className="flex items-center">
            <Select defaultValue='relevant' onValueChange={setSortType}>
              <SelectTrigger className="w-[100px] h-8 text-xs border border-gray-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevant" className="text-xs">Relevant</SelectItem>
                <SelectItem value="low-high" className="text-xs">Low-High</SelectItem>
                <SelectItem value="high-low" className="text-xs">High-Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Country Filter Flags */}
          <div className="flex items-center gap-1">
            {/* All Countries Button */}
            <button
              onClick={() => setSelectedCountry('')}
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs transition-all ${
                selectedCountry === ''
                  ? 'bg-brand text-white shadow-md'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
              title="All Countries"
            >
              🌍
            </button>

            {/* Nigeria Flag Button */}
            <button
              onClick={() => setSelectedCountry('Nigeria')}
              className={`w-7 h-7 rounded-full flex items-center justify-center text-sm transition-all ${
                selectedCountry === 'Nigeria'
                  ? 'bg-brand/20 ring-2 ring-brand shadow-md'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
              title="Nigeria"
            >
              <img src={flagImages.Nigeria} alt="Nigeria Flag"/>
            </button>

            {/* China Flag Button */}
            <button
              onClick={() => setSelectedCountry('China')}
              className={`w-7 h-7 rounded-full flex items-center justify-center text-sm transition-all ${
                selectedCountry === 'China'
                  ? 'bg-brand/20 ring-2 ring-brand shadow-md'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
              title="China"
            >
              <img src={flagImages.China} alt="Nigeria Flag"/>
            </button>
          </div>
        </div>

        {/* Desktop Header - Keep original structure for desktop */}
        <div className="hidden md:block">
          <p className='my-2 text-xl font-medium'>FILTERS</p>
        </div>

        {/* Existing Filter Sections */}
        <div className={`${showFilter ? '' : 'hidden'} md:block`}>
          {/* Category Filter */}
          <div className={`border border-gray-300 pl-5 py-3 mt-6 ${showFilter ? '' : 'hidden'} md:block`}>
            <p className='mb-3 text-xs sm:text-sm font-medium tracking-wide'>CATEGORIES</p>
            <div className='flex flex-col gap-3 text-sm font-light text-gray-700'>
              {["Men", "Women", "Kids"].map(cat => (
                <div key={cat} className="items-center flex space-x-2">
                  <Checkbox id={cat} onCheckedChange={() => toggleCategory(cat)} checked={selectedCategory.includes(cat)} />
                  <label htmlFor={cat} className="text-sm leading-relaxed cursor-pointer">{cat}</label>
                </div>
              ))}
            </div>
          </div>

          {/* Country of Origin Filter */}
          <div className={`border border-gray-300 pl-5 py-3 my-5 ${showFilter ? '' : 'hidden'} md:block`}>
            <p className='mb-3 text-xs sm:text-sm font-medium tracking-wide'>COUNTRY OF ORIGIN</p>
            <div className='flex flex-col gap-3 text-sm font-light text-gray-700'>
              {/* All Countries Option */}
              <div
                className={`flex items-center space-x-3 p-2 rounded-md cursor-pointer transition-colors hover:bg-gray-50 ${
                  selectedCountry === '' ? 'bg-brand/10 border border-brand/20' : ''
                }`}
                onClick={() => setSelectedCountry('')}
              >
                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs">
                  🌍
                </div>
                <span className={`${selectedCountry === '' ? 'font-medium text-brand' : ''}`}>
                  All Countries
                </span>
              </div>

              {/* Nigeria Option */}
              <div
                className={`flex items-center space-x-3 p-2 rounded-md cursor-pointer transition-colors hover:bg-gray-50 ${
                  selectedCountry === 'Nigeria' ? 'bg-brand/10 border border-brand/20' : ''
                }`}
                onClick={() => setSelectedCountry('Nigeria')}
              >
                <div className="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center text-lg">
                  <img src={flagImages.Nigeria} alt="Nigeria Flag"/>
                </div>
                <span className={`${selectedCountry === 'Nigeria' ? 'font-medium text-brand' : ''}`}>
                  Nigeria
                </span>
              </div>

              {/* China Option */}
              <div
                className={`flex items-center space-x-3 p-2 rounded-md cursor-pointer transition-colors hover:bg-gray-50 ${
                  selectedCountry === 'China' ? 'bg-brand/10 border border-brand/20' : ''
                }`}
                onClick={() => setSelectedCountry('China')}
              >
                <div className="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center text-lg">
                  <img src={flagImages.China} alt="Nigeria Flag"/>
                </div>
                <span className={`${selectedCountry === 'China' ? 'font-medium text-brand' : ''}`}>
                  China
                </span>
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

          {/* Bestseller Filter */}
          <div className={`border border-gray-300 pl-5 py-3 my-5 ${showFilter ? '' : 'hidden'} md:block`}>
            <p className='mb-3 text-xs sm:text-sm font-medium tracking-wide'>EXTRAS</p>
            <div className="items-center flex space-x-2">
              <Checkbox id="Bestseller" onCheckedChange={() => setBestsellerOnly(!bestsellerOnly)} checked={bestsellerOnly} />
              <label htmlFor="Bestseller" className="text-sm leading-relaxed font-light cursor-pointer">Bestsellers</label>
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

      {/* Products Section */}
      <div className='flex-1'>
        <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4 mb-4'>
          <Title
            text1={isPreorder ? 'PRE' : (selectedCountry ? selectedCountry.toUpperCase() : 'ALL')}
            text2={isPreorder ? 'ORDERS' : 'COLLECTIONS'}
          />
          
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
        
        {/* Product Grid */}
        {isLoading ? <CollectionSkeleton /> : (
          <div>
            {/* Products count */}
            {filterProducts.length > 0 && (
              <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-4 text-xs sm:text-sm text-gray-600'>
                <p className='font-medium'>
                  Showing {filterProducts.length} product{filterProducts.length !== 1 ? 's' : ''}
                </p>
              </div>
            )}

            <div className='grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-4 gap-y-8 sm:gap-y-14'>
              {filterProducts.map((item) => (
                <ProductItem key={item._id} id={item._id} name={item.name} price={item.price} image={item.image} />
              ))}
            </div>

            {!filterProducts.length && (
              <div className='col-span-full text-center py-8'>
                <p className='text-sm sm:text-base text-gray-600 mb-2'>Sorry, no products were found!</p>
                <p className='text-xs sm:text-sm text-gray-500'>Please try adjusting your filters or search terms.</p>
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
