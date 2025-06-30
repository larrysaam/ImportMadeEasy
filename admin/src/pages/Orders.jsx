import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { backendUrl, currency } from '../App'
import { toast } from "sonner"
import { assets } from '../assets/assets'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const Orders = ({token}) => {
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('All')
  const [countryFilter, setCountryFilter] = useState('All')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('date')
  const [sortOrder, setSortOrder] = useState('desc')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedUser, setSelectedUser] = useState('All')
  const [availableUsers, setAvailableUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const ordersPerPage = 5

  const fetchAllOrders = async () => {
    if (!token) {
      setLoading(false)
      return null
    }

    try {
      setError(null)
      const response = await axios.post(backendUrl + '/api/order/list',{},{headers: {token}})
      if (response.data.success) {
        setOrders(response.data.orders.reverse())
      } else {
        setError(response.data.message)
        toast.error(response.data.message)
      }
    } catch (error) {
      console.log(error)
      setError(error.message)
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchAllProducts = async () => {
    try {
      const response = await axios.get(backendUrl + '/api/product/list')
      if (response.data.success) {
        setProducts(response.data.products)
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  // Helper function to get color hex code
  const getColorHex = (productId, colorName) => {
    if (!colorName || !products.length) return null
    
    const product = products.find(p => p._id === productId)
    if (!product || !product.colors) return null
    
    const colorData = product.colors.find(c => c.colorName === colorName)
    return colorData?.colorHex || null
  }

  const statusHandler = async (value, orderId) => {
    try {
      const response = await axios.post(backendUrl + '/api/order/status', 
        {orderId, status: value}, {headers: {token}})

      if (response.data.success) {
        toast.success(response.data.message)
        fetchAllOrders()
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  const paymentHandler = async (orderId) => {
    try {
      const response = await axios.post(
        backendUrl + '/api/order/payment', 
        { orderId }, 
        { headers: { token }}
      );

      console.log(response.data.success);
      if (response.data.success) {
        toast.success(response.data.message);
        fetchAllOrders();
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  // Helper function to get user name from order
  const getUserName = (order) => {
    return order.address?.firstName && order.address?.lastName
      ? `${order.address.firstName} ${order.address.lastName}`
      : 'Unknown User'
  }

  // Helper function to get product names from order
  const getProductNames = (order) => {
    return order.items?.map(item => item.name).join(', ') || 'No products'
  }

  // Get users who made orders on selected date
  const getUsersForSelectedDate = () => {
    if (!selectedDate) return []

    const selectedDateObj = new Date(selectedDate)
    const ordersOnDate = orders.filter(order => {
      const orderDate = new Date(order.date)
      return orderDate.toDateString() === selectedDateObj.toDateString()
    })

    const users = ordersOnDate.map(order => ({
      name: getUserName(order),
      userId: order.userId
    }))

    // Remove duplicates
    const uniqueUsers = users.filter((user, index, self) =>
      index === self.findIndex(u => u.userId === user.userId)
    )

    return uniqueUsers.sort((a, b) => a.name.localeCompare(b.name))
  }

  // Filter and sort orders
  const getFilteredAndSortedOrders = () => {
    let filtered = orders

    // Filter by status
    if (statusFilter !== 'All') {
      filtered = filtered.filter(order => order.status === statusFilter)
    }

    // Filter by country
    if (countryFilter !== 'All') {
      filtered = filtered.filter(order =>
        order.shipping?.country?.toLowerCase() === countryFilter.toLowerCase()
      )
    }

    // Filter by selected date (when sorting by date)
    if (selectedDate && sortBy === 'date') {
      const selectedDateObj = new Date(selectedDate)
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.date)
        return orderDate.toDateString() === selectedDateObj.toDateString()
      })
    }

    // Filter by selected user (when sorting by user and user is selected)
    if (selectedUser !== 'All' && sortBy === 'user') {
      filtered = filtered.filter(order => {
        const userName = getUserName(order)
        return userName === selectedUser
      })
    }

    // Filter by search term (user name, product name) - only when not using date/user filters
    if (searchTerm.trim() && sortBy !== 'date' && sortBy !== 'user') {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(order => {
        const userName = getUserName(order).toLowerCase()
        const productNames = getProductNames(order).toLowerCase()
        return userName.includes(searchLower) || productNames.includes(searchLower)
      })
    }

    // Sort orders
    filtered.sort((a, b) => {
      let aValue, bValue

      switch (sortBy) {
        case 'date':
          aValue = new Date(a.date)
          bValue = new Date(b.date)
          break
        case 'user':
          aValue = getUserName(a).toLowerCase()
          bValue = getUserName(b).toLowerCase()
          break
        case 'country':
          aValue = a.shipping?.country || 'unknown'
          bValue = b.shipping?.country || 'unknown'
          break
        case 'amount':
          aValue = a.amount
          bValue = b.amount
          break
        default:
          aValue = a.date
          bValue = b.date
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return filtered
  }

  const filteredOrders = getFilteredAndSortedOrders()

  // Get current orders after filtering and sorting
  const indexOfLastOrder = currentPage * ordersPerPage
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder)
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage)

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber)

  // Add this pagination helper function at the top of your component
  const getPaginationRange = (currentPage, totalPages) => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (currentPage <= 3) {
      return [1, 2, 3, '...', totalPages];
    }

    if (currentPage >= totalPages - 2) {
      return [1, '...', totalPages - 2, totalPages - 1, totalPages];
    }

    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
  };

  useEffect(() => {
    fetchAllOrders()
    fetchAllProducts()
  }, [token])

  // Reset to first page when status filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [statusFilter, countryFilter, searchTerm, sortBy, sortOrder, selectedDate, selectedUser])

  // Update available users when date changes or when sorting by user
  useEffect(() => {
    if (sortBy === 'user') {
      if (selectedDate) {
        // Get users for selected date
        setAvailableUsers(getUsersForSelectedDate())
      } else {
        // Get all users who have made orders
        const allUsers = orders.map(order => ({
          name: getUserName(order),
          userId: order.userId
        }))

        // Remove duplicates
        const uniqueUsers = allUsers.filter((user, index, self) =>
          index === self.findIndex(u => u.userId === user.userId)
        )

        setAvailableUsers(uniqueUsers.sort((a, b) => a.name.localeCompare(b.name)))
      }
    } else {
      setAvailableUsers([])
    }
  }, [sortBy, selectedDate, orders])

  // Reset user selection when date changes or sort changes
  useEffect(() => {
    if (sortBy !== 'user') {
      setSelectedUser('All')
      setSelectedDate('')
    } else if (sortBy === 'user' && selectedDate) {
      setSelectedUser('All')
    }
  }, [sortBy, selectedDate])

  // Get unique statuses from orders for filter options
  const getUniqueStatuses = () => {
    const statuses = [...new Set(orders.map(order => order.status))]
    return statuses.sort()
  }

  // Loading state
  if (loading) {
    return (
      <div className="px-3 sm:px-6 lg:px-8 pb-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-t-blue-600 border-gray-300 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 text-sm sm:text-base">Loading orders...</p>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="px-3 sm:px-6 lg:px-8 pb-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-red-500 text-base sm:text-lg mb-2">Error loading orders</div>
            <p className="text-gray-600 text-sm sm:text-base mb-4">{error}</p>
            <button
              onClick={() => {
                setLoading(true)
                fetchAllOrders()
              }}
              className="px-4 py-2 bg-blue-600 text-white text-sm sm:text-base rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="px-3 sm:px-6 lg:px-8 pb-4">
      {/* Mobile-friendly header */}
      <div className="mb-4 sm:mb-6">
        <h3 className="text-xl sm:text-2xl font-medium mb-4">Order Management</h3>
        
        {/* Comprehensive Filters - Mobile optimized */}
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="w-full">
            <input
              type="text"
              placeholder="Search by user name or product name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filter Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Status Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Statuses</SelectItem>
                  {getUniqueStatuses().map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Country Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Country</label>
              <Select value={countryFilter} onValueChange={setCountryFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Countries" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Countries</SelectItem>
                  <SelectItem value="nigeria">Nigeria</SelectItem>
                  <SelectItem value="china">China</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Sort By</label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="user">User Name</SelectItem>
                  <SelectItem value="country">Country</SelectItem>
                  <SelectItem value="amount">Amount</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort Order */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Order</label>
              <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sort order" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Newest First</SelectItem>
                  <SelectItem value="asc">Oldest First</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date Picker - Show when sorting by date */}
          {sortBy === 'date' && (
            <div className="mt-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">Select Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {selectedDate && (
                <div className="mt-2 text-xs text-gray-600">
                  Showing orders for {new Date(selectedDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              )}
            </div>
          )}

          {/* User Selection - Show when sorting by user */}
          {sortBy === 'user' && (
            <div className="mt-3 space-y-3">
              {/* Date picker for user filtering */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Select Date (optional - to see users who ordered on specific date)
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {selectedDate && (
                  <button
                    onClick={() => setSelectedDate('')}
                    className="ml-2 text-xs text-blue-600 hover:text-blue-800 underline"
                  >
                    Clear date
                  </button>
                )}
              </div>

              {/* User selection */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Select User {selectedDate ? `(who ordered on ${new Date(selectedDate).toLocaleDateString()})` : ''}
                </label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger className="w-full sm:w-auto min-w-[200px]">
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Users</SelectItem>
                    {availableUsers.map((user) => (
                      <SelectItem key={user.userId} value={user.name}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {availableUsers.length === 0 && selectedDate && (
                  <div className="mt-1 text-xs text-gray-500">
                    No users found for the selected date
                  </div>
                )}
                {selectedUser !== 'All' && (
                  <div className="mt-1 text-xs text-gray-600">
                    Showing all orders by {selectedUser}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Results Summary */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
            <div className="text-xs sm:text-sm text-gray-600">
              <span className="font-medium">
                Showing {currentOrders.length} of {filteredOrders.length} orders
              </span>
              {(statusFilter !== 'All' || countryFilter !== 'All' || searchTerm.trim() || selectedDate || selectedUser !== 'All') && (
                <span className="block sm:inline sm:ml-1 text-blue-600">
                  (filtered from {orders.length} total)
                </span>
              )}
              {/* Show active filters */}
              <div className="mt-1 flex flex-wrap gap-1">
                {statusFilter !== 'All' && (
                  <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                    Status: {statusFilter}
                  </span>
                )}
                {countryFilter !== 'All' && (
                  <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded capitalize">
                    Country: {countryFilter}
                  </span>
                )}
                {selectedDate && (
                  <span className="inline-block px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                    Date: {new Date(selectedDate).toLocaleDateString()}
                  </span>
                )}
                {selectedUser !== 'All' && (
                  <span className="inline-block px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">
                    User: {selectedUser}
                  </span>
                )}
                {searchTerm.trim() && (
                  <span className="inline-block px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                    Search: "{searchTerm}"
                  </span>
                )}
              </div>
            </div>

            {/* Clear Filters Button */}
            {(statusFilter !== 'All' || countryFilter !== 'All' || searchTerm.trim() || selectedDate || selectedUser !== 'All') && (
              <button
                onClick={() => {
                  setStatusFilter('All')
                  setCountryFilter('All')
                  setSearchTerm('')
                  setSelectedDate('')
                  setSelectedUser('All')
                  setCurrentPage(1)
                }}
                className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        {currentOrders.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-sm sm:text-base lg:text-lg mb-2">
              {filteredOrders.length === 0 
                ? (statusFilter === 'All' 
                    ? 'No orders found' 
                    : `No orders with status "${statusFilter}"`)
                : 'No orders on this page'
              }
            </div>
            {statusFilter !== 'All' && (
              <button
                onClick={() => setStatusFilter('All')}
                className="text-blue-600 hover:text-blue-800 underline text-sm sm:text-base"
              >
                Show all orders
              </button>
            )}
          </div>
        ) : (
          currentOrders.map((order, index) => (
          <div 
            key={index} 
            className='border rounded-lg bg-white shadow-sm overflow-hidden'
          >
            {/* Order Header - Mobile optimized */}
            <div className="bg-gray-50 px-3 sm:px-4 py-3 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img src={assets.parcelIcon} alt='parcel-icon' className='w-5 sm:w-6' />
                  <p className="font-medium text-sm sm:text-base">
                    Order #{order._id.slice(-6)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    order.status === 'Delivered' ? 'bg-green-500' :
                    order.status === 'Shipped' || order.status === 'Delivery in progress' ? 'bg-blue-500' :
                    order.status === 'Packing' ? 'bg-yellow-500' :
                    'bg-gray-400'
                  }`}></div>
                  <span className="text-xs sm:text-sm font-medium text-gray-700">
                    {order.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3 sm:p-4 space-y-4">

            {/* Order Items - Mobile optimized */}
            <div className="space-y-2 sm:space-y-3">
              {order.items.map((item, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex gap-3">
                    {/* Product Image */}
                    {item.image && item.image.length > 0 && (
                      <img 
                        src={Array.isArray(item.image) ? item.image[0] : item.image} 
                        alt={item.name}
                        className="w-12 h-12 sm:w-14 sm:h-14 object-cover rounded-md border flex-shrink-0"
                      />
                    )}
                    
                    {/* Product Details */}
                    <div className='flex-1 min-w-0'>
                      <p className="font-medium text-sm sm:text-base truncate">{item.name}</p>
                      
                      {/* Mobile: Stack details vertically */}
                      <div className="mt-2 space-y-1 sm:space-y-0 sm:flex sm:items-center sm:gap-4 sm:flex-wrap">
                        {/* Color indicator with actual color */}
                        {item.color && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600 text-xs sm:text-sm">Color:</span>
                            <div className="flex items-center gap-1">
                              <div 
                                className="w-3 h-3 sm:w-4 sm:h-4 rounded-full border border-gray-300 shadow-sm"
                                style={{ 
                                  backgroundColor: getColorHex(item._id, item.color) || '#ccc'
                                }}
                                title={item.color}
                              ></div>
                              <span className="text-gray-800 font-medium text-xs sm:text-sm">{item.color}</span>
                            </div>
                          </div>
                        )}
                        
                        {/* Size and Quantity on same line for mobile */}
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <span className="text-gray-600 text-xs sm:text-sm">Size:</span>
                            <span className="text-gray-800 font-medium text-xs sm:text-sm">{item.size}</span>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <span className="text-gray-600 text-xs sm:text-sm">Qty:</span>
                            <span className="text-gray-800 font-medium text-xs sm:text-sm">{item.quantity}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Price - Mobile optimized */}
                      <div className="mt-2 text-xs sm:text-sm">
                        <span className="text-gray-600">
                          {currency}{item.price} × {item.quantity} = 
                        </span>
                        <span className="font-medium text-gray-900 ml-1">
                          {currency}{(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Customer Details - Mobile optimized */}
            <div className="border-t pt-3">
              <h4 className="font-medium text-xs sm:text-sm mb-2 text-gray-800">Customer Details</h4>
              <div className="bg-gray-50 rounded-lg p-3 text-xs sm:text-sm space-y-1">
                <p className='font-medium text-gray-900'>
                  {order.address.firstName + " " + order.address.lastName}
                </p>
                <p className="text-gray-600">
                  {order.address.street}
                </p>
                <p className="text-gray-600">
                  {order.address.city}, {order.address.state}
                </p>
                <p className="text-gray-600">
                  {order.address.country}, {order.address.zipcode}
                </p>
                <p className="text-gray-600 font-medium">{order.address.phone}</p>
              </div>
            </div>

            {/* Order Summary - Mobile optimized */}
            <div className="border-t pt-3">
              <h4 className="font-medium text-xs sm:text-sm mb-2 text-gray-800">Order Summary</h4>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
                  <div className="space-y-1">
                    <p><span className="text-gray-600">Items:</span> <span className="font-medium">{order.items.length}</span></p>
                    <p><span className="text-gray-600">Payment:</span>
                      <span className={`font-medium ml-1 ${order.payment ? 'text-green-600' : 'text-orange-600'}`}>
                        {order.payment ? 'Done' : 'Pending'}
                      </span>
                    </p>
                    <p><span className="text-gray-600">Country:</span>
                      <span className="font-medium ml-1 capitalize">
                        {order.shipping?.country || 'Unknown'}
                      </span>
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p><span className="text-gray-600">Method:</span> <span className="font-medium">{order.paymentMethod}</span></p>
                    <p><span className="text-gray-600">Date:</span> <span className="font-medium">{new Date(order.date).toLocaleDateString()}</span></p>
                    <p><span className="text-gray-600">Shipping:</span>
                      <span className="font-medium ml-1 capitalize">
                        {order.shipping?.method || 'Sea'}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Shipping Details */}
                {order.shipping && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <h5 className="font-medium text-xs mb-2 text-gray-700">Shipping Details</h5>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="space-y-1">
                        <p><span className="text-gray-600">Weight:</span> <span className="font-medium">{order.shipping.weight?.toFixed(1) || '0'} kg</span></p>
                        <p><span className="text-gray-600">Method:</span>
                          <span className="font-medium ml-1 capitalize">
                            {order.shipping.method === 'air' ? 'Air (Express)' :
                             order.shipping.method === 'sea' ? 'Sea (Normal)' :
                             order.shipping.method === 'land' ? 'Land (Local)' :
                             order.shipping.method}
                          </span>
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p><span className="text-gray-600">Shipping Cost:</span>
                          <span className="font-medium ml-1">{currency}{order.shipping.cost?.toLocaleString() || '0'}</span>
                        </p>
                        <p><span className="text-gray-600">Origin:</span>
                          <span className="font-medium ml-1 capitalize">{order.shipping.country || 'Unknown'}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Product Total:</span>
                    <span className="text-sm font-medium">{currency}{order.amount}</span>
                  </div>
                  {order.shipping?.cost && (
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-sm font-medium text-gray-700">Shipping Fee:</span>
                      <span className="text-sm font-medium">{currency}{order.shipping.cost.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-300">
                    <span className="text-sm sm:text-base font-bold text-gray-900">Grand Total:</span>
                    <span className="text-sm sm:text-base font-bold text-gray-900">
                      {currency}{(order.amount + (order.shipping?.cost || 0)).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-orange-600 mt-1">*Shipping fee paid on delivery</p>
                </div>
              </div>
            </div>

            {/* Actions - Mobile optimized */}
            <div className='border-t pt-3'>
              <h4 className="font-medium text-xs sm:text-sm mb-3 text-gray-800">Actions</h4>
              <div className='flex flex-col gap-3'>
                <div>
                  <label className="block text-xs sm:text-sm text-gray-600 mb-1">Update Status:</label>
                  <Select 
                    defaultValue={order.status} 
                    value={order.status} 
                    onValueChange={(value)=> statusHandler(value, order._id)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue /> 
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Order Placed">Order placed</SelectItem>
                      <SelectItem value="Packing">Packing</SelectItem>
                      <SelectItem value="Shipped">Shipped</SelectItem>
                      <SelectItem value="Delivery in progress">Delivery in progress</SelectItem>
                      <SelectItem value="Delivered">Delivered</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {!order.payment && (
                  <button
                    onClick={() => paymentHandler(order._id)}
                    className="w-full px-4 py-3 text-sm font-medium bg-green-500 text-white 
                      rounded-lg hover:bg-green-600 transition-colors active:bg-green-700"
                  >
                    Validate Payment
                  </button>
                )}
              </div>
            </div>
            </div>
          </div>
          ))
        )}
      </div>

      {/* Pagination - Mobile optimized */}
      {filteredOrders.length > ordersPerPage && (
        <div className="mt-6 pb-6">
          {/* Mobile: Show simple prev/next with page info */}
          <div className="flex flex-col sm:hidden gap-3">
            <div className="text-center text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex-1 max-w-[120px] px-4 py-2 text-sm border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 font-medium"
              >
                Previous
              </button>
              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="flex-1 max-w-[120px] px-4 py-2 text-sm border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 font-medium"
              >
                Next
              </button>
            </div>
          </div>

          {/* Desktop: Show full pagination */}
          <div className="hidden sm:flex justify-center gap-2 overflow-x-auto">
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
            >
              Previous
            </button>
            
            {getPaginationRange(currentPage, totalPages).map((pageNum, index) => (
              <React.Fragment key={index}>
                {pageNum === '...' ? (
                  <span className="px-3 py-1 text-sm">...</span>
                ) : (
                  <button
                    onClick={() => paginate(pageNum)}
                    className={`px-3 py-1 text-sm border rounded-md hover:bg-gray-100 
                      ${currentPage === pageNum ? 'bg-gray-200' : ''}`}
                  >
                    {pageNum}
                  </button>
                )}
              </React.Fragment>
            ))}

            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Orders