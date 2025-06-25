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
  const isPreorder = searchParams.get('preorder') === 'true'

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [goToPage, setGoToPage] = useState('')
  const productsPerPage = 15

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

    // Search filter
    if (showSearch && search) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(search.toLowerCase())
      )
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

    setFilterProducts(filtered)
    // Reset to first page when filters change
    setCurrentPage(1)
  }

  // Calculate pagination values
  const totalProducts = filterProducts.length
  const totalPages = Math.ceil(totalProducts / productsPerPage)
  const startIndex = (currentPage - 1) * productsPerPage
  const endIndex = startIndex + productsPerPage
  const currentProducts = filterProducts.slice(startIndex, endIndex)

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
  }, [selectedCategory, selectedSubCategory, search, showSearch, products, bestsellerOnly, preorderOnly])

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

  // Pagination handlers
  const handlePageChange = (page) => {
    setCurrentPage(page)
    setGoToPage('') // Clear the go-to-page input
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handlePrevPage = () => {
    if (currentPage > 1) {
      handlePageChange(currentPage - 1)
    }
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      handlePageChange(currentPage + 1)
    }
  }

  const handleGoToPage = (e) => {
    e.preventDefault()
    const page = parseInt(goToPage)
    if (page >= 1 && page <= totalPages) {
      handlePageChange(page)
      setGoToPage('')
    }
  }

  return (
    <div className='flex flex-col px-4 sm:px-8 md:flex-row gap-1 sm:gap-10 pt-10 border-t animate-fade animate-duration-500'>
      {/* Mobile Filter Header */}
      <div className='min-w-60'>
        <div className="flex justify-between items-center">
          <p onClick={() => setShowFilter(!showFilter)} className='my-2 text-xl flex items-center cursor-pointer gap-2'>
            FILTERS
            <img 
              src={assets.arrow} 
              alt='dropdown-icon' 
              className={`fill-gray-500 transition-all duration-200 h-3 rotate-270 md:hidden ${showFilter ? 'rotate-180' : ''}`} 
            />
          </p>
          {/* Add mobile preorder toggle */}
          {/* <button 
            onClick={() => handlePreorderChange(!preorderOnly)}
            className={`md:hidden px-3 py-1 text-sm rounded-full transition-colors
              ${preorderOnly 
                ? 'bg-black text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            {preorderOnly ? 'Show All' : 'Pre-orders'}
          </button> */}
        </div>

        {/* Existing Filter Sections */}
        <div className={`${showFilter ? '' : 'hidden'} md:block`}>
          {/* Category Filter */}
          <div className={`border border-gray-300 pl-5 py-3 mt-6 ${showFilter ? '' : 'hidden'} md:block`}>
            <p className='mb-3 text-sm font-medium'>CATEGORIES</p>
            <div className='flex flex-col gap-3 text-sm font-light text-gray-700'>
              {["Men", "Women", "Kids"].map(cat => (
                <div key={cat} className="items-center flex space-x-2">
                  <Checkbox id={cat} onCheckedChange={() => toggleCategory(cat)} checked={selectedCategory.includes(cat)} />
                  <label htmlFor={cat} className="text-sm leading-none">{cat}</label>
                </div>
              ))}
            </div>
          </div>

          {/* Subcategory Filter */}
          <div className={`border border-gray-300 pl-5 py-3 my-5 ${showFilter ? '' : 'hidden'} md:block`}>
            <p className='mb-3 text-sm font-medium'>TYPE</p>
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
                    className="text-sm leading-none capitalize"
                  >
                    {subCat}
                  </label>
                </div>
              ))}
            </div>
            {availableSubcategories.length === 0 && (
              <p className="text-sm text-gray-500 italic">
                Select a category to see available types
              </p>
            )}
          </div>

          {/* Bestseller Filter */}
          <div className={`border border-gray-300 pl-5 py-3 my-5 ${showFilter ? '' : 'hidden'} md:block`}>
            <p className='mb-3 text-sm font-medium'>EXTRAS</p>
            <div className="items-center flex space-x-2">
              <Checkbox id="Bestseller" onCheckedChange={() => setBestsellerOnly(!bestsellerOnly)} checked={bestsellerOnly} />
              <label htmlFor="Bestseller" className="text-sm leading-none font-light">Bestsellers</label>
            </div>
          </div>

          {/* Preorder Filter */}
          <div className={`border border-gray-300 pl-5 py-3 mt-6 hidden md:block`}>
            <p className='mb-3 text-sm font-medium'>PRODUCT TYPE</p>
            <div className="items-center flex space-x-2">
              <Checkbox 
                id="Preorder" 
                onCheckedChange={handlePreorderChange}
                checked={preorderOnly}
              />
              <label htmlFor="Preorder" className="text-sm leading-none font-light">
                Pre-order Only
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className='flex-1'>
        <div className='flex justify-between text-base sm:text-2xl mb-4'>
          <Title 
            text1={isPreorder ? 'PRE' : 'ALL'} 
            text2={isPreorder ? 'ORDERS' : 'COLLECTIONS'} 
          />
          
          {/* Product Sort Dropdown */}
          <Select defaultValue='relevant' onValueChange={setSortType} className='border-2 border-gray-300 text-sm px-2'>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevant">Sort by: Relevant</SelectItem>
              <SelectItem value="low-high">Sort by: Low to High</SelectItem>
              <SelectItem value="high-low">Sort by: High to Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Product Grid */}
        {isLoading ? <CollectionSkeleton /> : (
          <div>
            {/* Products count and pagination info */}
            {totalProducts > 0 && (
              <div className='flex justify-between items-center mb-4 text-sm text-gray-600'>
                <p>
                  Showing {startIndex + 1}-{Math.min(endIndex, totalProducts)} of {totalProducts} products
                </p>
                {totalPages > 1 && (
                  <p>
                    Page {currentPage} of {totalPages}
                  </p>
                )}
              </div>
            )}

            <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 gap-y-14'>
              {currentProducts.map((item) => (
                <ProductItem key={item._id} id={item._id} name={item.name} price={item.price} image={item.image} />
              ))}
            </div>

            {!filterProducts.length && (
              <p className='text-center text-gray-600 mt-5'>Sorry, no products were found! Please try another search.</p>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className='mt-8'>
                {/* Mobile Pagination - Simple Previous/Next */}
                <div className='flex justify-between items-center sm:hidden mb-4'>
                  <button
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      currentPage === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-black text-white hover:bg-gray-800'
                    }`}
                  >
                    ← Previous
                  </button>

                  <span className='text-sm text-gray-600'>
                    Page {currentPage} of {totalPages}
                  </span>

                  <button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      currentPage === totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-black text-white hover:bg-gray-800'
                    }`}
                  >
                    Next →
                  </button>
                </div>

                {/* Desktop Pagination - Full Controls */}
                <div className='hidden sm:flex justify-center items-center gap-2'>
                  {/* Previous Button */}
                  <button
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      currentPage === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Previous
                  </button>

                  {/* Page Numbers */}
                  <div className='flex gap-1'>
                    {(() => {
                      const pages = []
                      const maxVisiblePages = 5
                      let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
                      let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

                      // Adjust start page if we're near the end
                      if (endPage - startPage + 1 < maxVisiblePages) {
                        startPage = Math.max(1, endPage - maxVisiblePages + 1)
                      }

                      // Add first page and ellipsis if needed
                      if (startPage > 1) {
                        pages.push(
                          <button
                            key={1}
                            onClick={() => handlePageChange(1)}
                            className='px-3 py-2 rounded-md text-sm font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                          >
                            1
                          </button>
                        )
                        if (startPage > 2) {
                          pages.push(
                            <span key="ellipsis1" className='px-2 py-2 text-gray-500'>
                              ...
                            </span>
                          )
                        }
                      }

                      // Add visible page numbers
                      for (let i = startPage; i <= endPage; i++) {
                        pages.push(
                          <button
                            key={i}
                            onClick={() => handlePageChange(i)}
                            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                              i === currentPage
                                ? 'bg-black text-white'
                                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {i}
                          </button>
                        )
                      }

                      // Add last page and ellipsis if needed
                      if (endPage < totalPages) {
                        if (endPage < totalPages - 1) {
                          pages.push(
                            <span key="ellipsis2" className='px-2 py-2 text-gray-500'>
                              ...
                            </span>
                          )
                        }
                        pages.push(
                          <button
                            key={totalPages}
                            onClick={() => handlePageChange(totalPages)}
                            className='px-3 py-2 rounded-md text-sm font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                          >
                            {totalPages}
                          </button>
                        )
                      }

                      return pages
                    })()}
                  </div>

                  {/* Next Button */}
                  <button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      currentPage === totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Next
                  </button>
                </div>

                {/* Go to page input - only show if there are many pages */}
                {totalPages > 10 && (
                  <div className='flex items-center gap-2 mt-4'>
                    <span className='text-sm text-gray-600'>Go to page:</span>
                    <form onSubmit={handleGoToPage} className='flex items-center gap-2'>
                      <input
                        type='number'
                        min='1'
                        max={totalPages}
                        value={goToPage}
                        onChange={(e) => setGoToPage(e.target.value)}
                        className='w-16 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent'
                        placeholder='1'
                      />
                      <button
                        type='submit'
                        className='px-3 py-1 text-sm bg-black text-white rounded-md hover:bg-gray-800 transition-colors'
                      >
                        Go
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Collection
