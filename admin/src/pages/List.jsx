import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { backendUrl, currency } from '../App'
import { toast } from "sonner"
import { BsPencil, BsTrash } from 'react-icons/bs'
import { useNavigate, useSearchParams } from 'react-router-dom';

const List = ({token}) => {
  const [list, setList] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [showLowStock, setShowLowStock] = useState(false)
  const [filterType, setFilterType] = useState('all'); // 'all', 'normal', 'preorder'
  const itemsPerPage = 5
  const [searchParams] = useSearchParams()

  // Move getTotalQuantity to the top before it's used
  const getTotalQuantity = (product) => {
    if (!product || !product.colors || !Array.isArray(product.colors)) {
      return 0;
    }
    return product.colors.reduce((totalQty, colorVariant) => {
      const colorQty = colorVariant.sizes.reduce((sum, size) => sum + size.quantity, 0);
      return totalQty + colorQty;
    }, 0);
  }

  // Update the fetchList function
  const fetchList = async () => {
    try {
      const response = await axios.get(backendUrl + '/api/product/list')
      if (response.data.success) {
        // Sort products by creation date (newest first)
        const sortedProducts = response.data.products.sort((a, b) => {
          return new Date(b.createdAt) - new Date(a.createdAt)
        })
        setList(sortedProducts)
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  const removeProduct = async (id) => {
    try {
      
      const response = await axios.post(backendUrl + '/api/product/remove', {id}, {headers: {token}})

      if (response.data.success) {
        toast.success(response.data.message)
        await fetchList();
      } else {
        toast.error(response.data.message)
      }
      
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  const navigate = useNavigate();

  const handleEdit = (product) => {
    navigate(`/edit/${product._id}`);
  };

  // Get current products in reverse order
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage

  // Update the getFilteredProducts function that uses getTotalQuantity
  const getFilteredProducts = () => {
    return list
      .slice()
      .reverse()
      .filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'all' 
          ? true 
          : filterType === 'preorder' 
            ? product.preorder 
            : !product.preorder;
        
        if (!showLowStock) return matchesSearch && matchesType;
        
        const totalQuantity = getTotalQuantity(product);
        return matchesSearch && matchesType && totalQuantity < 10;
      })
  }

  // Keep the current items calculation as is
  const currentItems = getFilteredProducts()
    .slice(indexOfFirstItem, indexOfLastItem)

  // Update total pages calculation
  const totalPages = Math.ceil(getFilteredProducts().length / itemsPerPage)

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber)

  useEffect(()=> {
    fetchList()
  },[])

  // Sync search term with URL params from navbar
  useEffect(() => {
    const urlSearch = searchParams.get('search') || ''
    if (urlSearch !== searchTerm) {
      setSearchTerm(urlSearch)
      setCurrentPage(1) // Reset to first page when search changes
    }
  }, [searchParams])

  // Update the stats section to include preorder counts
  const getStats = () => {
    const preorderCount = list.filter(item => item.preorder).length;
    const normalCount = list.filter(item => !item.preorder).length;
    return { preorderCount, normalCount };
  }

  return (
  <>
    {/* Replace the existing stats and search section */}
    <div className='mb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2'>
      <p className="font-medium">All Products List</p>
      <div className='flex flex-wrap items-center gap-2 text-sm'>
        <p>Found: {getFilteredProducts().length}</p>
        <p>Low Stock: {list.filter(item => getTotalQuantity(item) < 10).length}</p>
        <p>Preorder: {getStats().preorderCount}</p>
        <p>Normal: {getStats().normalCount}</p>
        <p>Total: {list.length}</p>
      </div>
    </div>

    <div className='mb-4 flex flex-col sm:flex-row gap-2'>
      <input
        type="text"
        placeholder="Search products by name..."
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value)
          setCurrentPage(1)
        }}
        className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-200"
      />
      
      {/* Replace Filter Type Buttons with Dropdown */}
      <div className="flex gap-2">
        <select
          value={filterType}
          onChange={(e) => {
            setFilterType(e.target.value)
            setCurrentPage(1)
          }}
          className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-200 cursor-pointer"
        >
          <option value="all">All Products</option>
          <option value="normal">Normal Products</option>
          <option value="preorder">Preorder Products</option>
        </select>
        
        <button
          onClick={() => {
            setShowLowStock(!showLowStock)
            setCurrentPage(1)
          }}
          className={`whitespace-nowrap px-4 py-2 rounded-md transition-colors ${
            showLowStock 
              ? 'bg-red-500 text-white hover:bg-red-600' 
              : 'border border-red-500 text-red-500 hover:bg-red-50'
          }`}
        >
          {showLowStock ? 'Show All' : 'Show Low Stock'}
        </button>
      </div>
    </div>

    <div className='flex flex-col gap-2'>
      {/* -------- List Table Title --------*/}

      <div className='hidden md:grid h-12 grid-cols-[1fr_2fr_1fr_1fr_1fr_1fr_1fr] items-center py-1 px-2 border bg-gray-100 text-sm'>
        <b>Image</b>
        <b>Name</b>
        <b>Category</b>
        <b>Price</b>
        <b>Weight (kg)</b>
        <b>Stock</b>
        <b className='text-center'>Action</b>
      </div>

      {/* -------- Product List --------*/}

      {
        currentItems.map((item, index) => (
          <div
            className={`
              grid grid-cols-[1fr_2fr_1fr] md:grid-cols-[1fr_2fr_1fr_1fr_1fr_1fr_1fr]
              items-center gap-2 py-2 px-2 border text-sm
              ${getTotalQuantity(item) < 10 ? 'bg-red-50' : ''}
            `}
            key={index}
          >
            <img alt={item.name} src={item.image[0]} className='w-auto h-12 object-cover rounded-md'/>
            <p>{item.name}</p>
            <p>{item.category}</p>
            <p>{currency} {item.price?.toLocaleString('fr-CM')}</p>
            <p>{item.weight || 'N/A'} kg</p>
            <p className={`${getTotalQuantity(item) < 10 ? 'text-red-500 font-medium' : ''}`}>
              {getTotalQuantity(item)}
            </p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => handleEdit(item)}
                className="p-2 hover:text-blue-600 transition-colors"
              >
                <BsPencil size={16} />
              </button>
              <button
                onClick={() => removeProduct(item._id)}
                className="p-2 hover:text-red-600 transition-colors"
              >
                <BsTrash size={16} />
              </button>
            </div>
          </div>
        ))
      }

      {/* Pagination */}
      {list.length > itemsPerPage && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
          >
            Previous
          </button>
          
          {[...Array(totalPages)].map((_, index) => (
            <button
              key={index + 1}
              onClick={() => paginate(index + 1)}
              className={`px-3 py-1 text-sm border rounded-md hover:bg-gray-100 
                ${currentPage === index + 1 ? 'bg-gray-200' : ''}`}
            >
              {index + 1}
            </button>
          ))}

          <button
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
          >
            Next
          </button>
        </div>
      )}
    </div>
  </>
  )
}

export default List