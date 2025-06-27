import React, { useContext, useState } from 'react'
import { ShopContext } from '@/context/ShopContext'
import Title from '@/components/Title'
import { toast } from "sonner"
import { useQuery, useMutation } from "@tanstack/react-query"
import axios from "axios"
import { BsTrash } from 'react-icons/bs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ChevronLeft, ChevronRight } from 'lucide-react' // Add this import

const Orders = () => {
  const { currency, backendUrl, token } = useContext(ShopContext)
  const [filter, setFilter] = useState('orders')
  const [currentPage, setCurrentPage] = useState(1)
  const ordersPerPage = 8

  // Fetch orders using React Query
  const { data: orders = [], isLoading: ordersLoading, refetch: refetchOrders } = useQuery({
    queryKey: ['userOrders', token],
    queryFn: async () => {
      if (!token) return []
      const response = await axios.post(`${backendUrl}/api/order/userorders`, {}, { headers: { token } })
      if (response.data.success) {
        const orders = response.data.orders.flatMap(order =>
          order.items.map(item => ({
            ...item,
            status: order.status,
            payment: order.payment,
            paymentMethod: order.paymentMethod,
            date: order.date,
            type: 'order'
          }))
        )
        // Sort orders by date (most recent first)
        return orders.sort((a, b) => new Date(b.date) - new Date(a.date))
      }
      return []
    },
    enabled: !!token
  })

  // Fetch preorders using React Query
  const { data: preorders = [], isLoading: preordersLoading, refetch: refetchPreorders } = useQuery({
    queryKey: ['userPreorders', token],
    queryFn: async () => {
      if (!token) return []
      const response = await axios.post(
        `${backendUrl}/api/preorder/userpreorders`,
        {},
        { headers: { token } }
      )

      if (response.data.success) {
        // Sort preorders by createdAt (most recent first)
        return response.data.preorders
          .map(preorder => ({
            ...preorder,
            type: 'preorder'
          }))
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      }
      return []
    },
    enabled: !!token
  })

  // Update delete preorder mutation
  const deletePreorderMutation = useMutation({
    mutationFn: async (preorderId) => {
      const response = await axios.delete(`${backendUrl}/api/preorder/${preorderId}`, {
        headers: { token }
      })
      return response.data
    },
    onSuccess: () => {
      toast.success('Preorder cancelled successfully')
      // Refetch both orders and preorders
      refetchOrders()
      refetchPreorders()
    },
    onError: () => {
      toast.error('Failed to cancel preorder')
    }
  })

  const handleDeletePreorder = (preorderId, status) => {
    if (['cancelled', 'ready'].includes(status)) {
      toast.error("Can't cancel this preorder")
      return
    }
    
    if (window.confirm('Are you sure you want to cancel this preorder?')) {
      deletePreorderMutation.mutate(preorderId)
    }
  }

  // Reset to first page when filter changes - moved to top with other hooks
  React.useEffect(() => {
    setCurrentPage(1)
  }, [filter])

  const isLoading = ordersLoading || preordersLoading

  if (isLoading) {
    return <div className='px-4 sm:px-14 my-10 gap-6 flex justify-center items-center'>
      <div className="w-6 h-6 border-4 border-t-gray-800 border-gray-300 rounded-full animate-spin"></div>
      <p className="text-center text-gray-600 text-sm sm:text-base">Loading your orders...</p>
    </div>
  }

  // Pagination logic
  const getCurrentPageItems = (items) => {
    const indexOfLastItem = currentPage * ordersPerPage
    const indexOfFirstItem = indexOfLastItem - ordersPerPage
    return items.slice(indexOfFirstItem, indexOfLastItem)
  }

  // Filter orders based on selection
  const filteredOrders = filter === 'orders' ? orders : preorders
  const currentItems = getCurrentPageItems(filteredOrders)
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage)

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className='px-4 sm:px-14 border-t pt-16 animate-fade animate-duration-500'>
      <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8'>
        <div className='text-xl sm:text-2xl'>
          <Title text1='MY' text2='ORDERS' />
        </div>

        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full sm:w-[180px] text-sm sm:text-base">
            <SelectValue placeholder="Filter orders" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="orders" className="text-sm sm:text-base">Regular Orders</SelectItem>
            <SelectItem value="preorders" className="text-sm sm:text-base">Pre-orders</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="text-center text-gray-500 mt-6 px-4">
          <p className="text-sm sm:text-base lg:text-lg mb-2">
            {filter === 'orders'
              ? "You don't have any regular orders."
              : "You don't have any pre-orders."
            }
          </p>
          <span className="text-blue-600 cursor-pointer hover:underline text-sm sm:text-base" onClick={() => window.location.href = '/'}>
            Start shopping now!
          </span>
        </div>
      ) : (
        <>
          {/* Order items */}
          {currentItems.map((item, index) => (
            <div key={index} className='py-4 border-y text-gray-700 flex flex-col md:flex-row
            md:items-center md:justify-between gap-4'>
              <div className='flex items-start gap-3 sm:gap-6 text-sm'>
                <img src={(filter === 'preorders')? item.items[0].image : item.image?.[0]} alt="" className='w-14 sm:w-16 md:w-20 flex-shrink-0' />
                <div className='flex-1 min-w-0'>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-2">
                    <p className='text-sm sm:text-base font-medium leading-tight'>{item.name}</p>
                    {item.type === 'preorder' && (
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded self-start">Pre-order</span>
                    )}
                  </div>
                  <div className='flex flex-wrap items-center gap-2 sm:gap-3 mt-1 text-xs sm:text-sm text-gray-700'>
                    <p className='font-medium text-gray-900'>{currency} {((filter === 'preorders')? item.items[0].price : item.price)?.toLocaleString('fr-CM')}</p>
                    <p>Qty: {(filter === 'preorders')? item.items[0].quantity : item.quantity}</p>
                    <p>Size: {(filter === 'preorders')? item.items[0].size : item.size}</p>
                    {/* Display color if available */}
                    {((filter === 'preorders' && item.items[0].color) || (filter === 'orders' && item.color)) && (
                      <div className="flex items-center gap-1">
                        <span>Color:</span>
                        <span className="font-medium text-gray-800">
                          {(filter === 'preorders')? item.items[0].color : item.color}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className='mt-2 space-y-1'>
                    <p className='text-xs sm:text-sm'>
                      <span className='text-gray-600'>Date: </span>
                      <span className='text-gray-500'>{new Date((filter === 'preorders')? item.createdAt : item.date).toLocaleDateString()}</span>
                    </p>
                    <p className='text-xs sm:text-sm'>
                      <span className='text-gray-600'>Payment: </span>
                      <span className='text-gray-500'>{item.paymentMethod}</span>
                    </p>
                  </div>
                </div>
              </div>
              <div className='md:w-1/2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mt-3 md:mt-0'>
                <div className='flex items-center gap-2'>
                  <p className={`min-w-2 h-2 rounded-full ${
                    item.status === 'cancelled' ? 'bg-red-500' :
                    item.status === 'ready' ? 'bg-green-500' : 'bg-yellow-500'
                  }`}></p>
                  <p className='text-sm sm:text-base font-medium capitalize'>{item.status}</p>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  {item.type === 'preorder' && !['cancelled', 'ready'].includes(item.status) && (
                    <button
                      onClick={() => handleDeletePreorder(item._id, item.status)}
                      className="text-red-500 hover:text-red-700 p-1.5 sm:p-2 rounded-full hover:bg-red-50 transition-colors"
                      disabled={deletePreorderMutation.isPending}
                      title="Cancel preorder"
                    >
                      <BsTrash size={14} className="sm:w-4 sm:h-4" />
                    </button>
                  )}
                  <button
                    onClick={refetchOrders}
                    className={`border px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium rounded-lg transition-all duration-300 flex items-center gap-2
                      ${deletePreorderMutation.isPending ? 'bg-gray-400 text-gray-200 cursor-not-allowed' : 'hover:bg-gray-50'}`}
                    disabled={deletePreorderMutation.isPending}
                  >
                    Track Order
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-1 sm:gap-2 mt-8 pb-8">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`p-1.5 sm:p-2 rounded-lg transition-colors ${
                  currentPage === 1
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'hover:bg-gray-100'
                }`}
              >
                <ChevronLeft size={16} className="sm:w-5 sm:h-5" />
              </button>

              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => handlePageChange(i + 1)}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg transition-colors text-xs sm:text-sm font-medium ${
                    currentPage === i + 1
                      ? 'bg-black text-white'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  {i + 1}
                </button>
              ))}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`p-1.5 sm:p-2 rounded-lg transition-colors ${
                  currentPage === totalPages
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'hover:bg-gray-100'
                }`}
              >
                <ChevronRight size={16} className="sm:w-5 sm:h-5" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default Orders
