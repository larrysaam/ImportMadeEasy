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

  // Filter orders by status
  const filteredOrders = statusFilter === 'All' 
    ? orders 
    : orders.filter(order => order.status === statusFilter)

  // Get current orders after filtering
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
  }, [statusFilter])

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
            <p className="text-gray-600">Loading orders...</p>
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
            <div className="text-red-500 text-lg mb-2">Error loading orders</div>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => {
                setLoading(true)
                fetchAllOrders()
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
        
        {/* Status Filter - Mobile optimized */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Filter by Status:</span>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Orders</SelectItem>
                {getUniqueStatuses().map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Order count display - Mobile optimized */}
          <div className="text-xs sm:text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-md">
            <span className="font-medium">
              {currentOrders.length} of {filteredOrders.length} orders
            </span>
            {statusFilter !== 'All' && (
              <span className="block sm:inline sm:ml-1 text-blue-600">
                ({statusFilter})
              </span>
            )}
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        {currentOrders.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-2">
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
                className="text-blue-600 hover:text-blue-800 underline"
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
                            <span className="text-gray-600 text-xs">Color:</span>
                            <div className="flex items-center gap-1">
                              <div 
                                className="w-3 h-3 sm:w-4 sm:h-4 rounded-full border border-gray-300 shadow-sm"
                                style={{ 
                                  backgroundColor: getColorHex(item._id, item.color) || '#ccc'
                                }}
                                title={item.color}
                              ></div>
                              <span className="text-gray-800 font-medium text-xs">{item.color}</span>
                            </div>
                          </div>
                        )}
                        
                        {/* Size and Quantity on same line for mobile */}
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <span className="text-gray-600 text-xs">Size:</span>
                            <span className="text-gray-800 font-medium text-xs">{item.size}</span>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <span className="text-gray-600 text-xs">Qty:</span>
                            <span className="text-gray-800 font-medium text-xs">{item.quantity}</span>
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
              <h4 className="font-medium text-sm mb-2 text-gray-800">Customer Details</h4>
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
              <h4 className="font-medium text-sm mb-2 text-gray-800">Order Summary</h4>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
                  <div className="space-y-1">
                    <p><span className="text-gray-600">Items:</span> <span className="font-medium">{order.items.length}</span></p>
                    <p><span className="text-gray-600">Payment:</span> 
                      <span className={`font-medium ml-1 ${order.payment ? 'text-green-600' : 'text-orange-600'}`}>
                        {order.payment ? 'Done' : 'Pending'}
                      </span>
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p><span className="text-gray-600">Method:</span> <span className="font-medium">{order.paymentMethod}</span></p>
                    <p><span className="text-gray-600">Date:</span> <span className="font-medium">{new Date(order.date).toLocaleDateString()}</span></p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-base sm:text-lg font-bold text-gray-900">
                    Total: {currency}{order.amount}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions - Mobile optimized */}
            <div className='border-t pt-3'>
              <h4 className="font-medium text-sm mb-3 text-gray-800">Actions</h4>
              <div className='flex flex-col gap-3'>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Update Status:</label>
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