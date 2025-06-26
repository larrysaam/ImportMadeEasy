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
      <p className="text-center text-gray-600">Loading your orders...</p>
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
      <div className='flex justify-between items-center mb-8'>
        <div className='text-2xl'>
          <Title text1='MY' text2='ORDERS' />
        </div>
        
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter orders" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="orders">Regular Orders</SelectItem>
            <SelectItem value="preorders">Pre-orders</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredOrders.length === 0 ? (
        <p className="text-center text-gray-500 mt-6 text-lg">
          {filter === 'orders'
            ? "You don't have any regular orders."
            : "You don't have any pre-orders."
          } <br /> 
          <span className="text-blue-600 cursor-pointer hover:underline" onClick={() => window.location.href = '/'}>
            Start shopping now!
          </span>
        </p>
      ) : (
        <>
          {/* Order items */}
          {currentItems.map((item, index) => (
            <div key={index} className='py-4 border-y text-gray-700 flex flex-col md:flex-row
            md:items-center md:justify-between gap-4'>
              <div className='flex items-center gap-6 text-sm'>
                <img src={(filter === 'preorders')? item.items[0].image : item.image?.[0]} alt="" className='w-16 sm:w-20' />
                <div>
                  <div className="flex items-center gap-2">
                    <p className='sm:text-base font-medium'>{item.name}</p>
                    {item.type === 'preorder' && (
                      <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-0.5 rounded">Pre-order</span>
                    )}
                  </div>
                  <div className='flex flex-wrap items-center gap-3 mt-1 text-base text-gray-700'>
                    <p>{currency} {((filter === 'preorders')? item.items[0].price : item.price)?.toLocaleString('fr-CM')}</p>
                    <p>Quantity: {(filter === 'preorders')? item.items[0].quantity : item.quantity}</p>
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
                  <p>{`Date: `} 
                    <span className='text-gray-400'>{new Date((filter === 'preorders')? item.createdAt : item.date).toLocaleString()}</span>
                  </p>
                  <p>{`Payment: `} 
                    <span className='text-gray-400'>{item.paymentMethod}</span>
                  </p>
                </div>
              </div>
              <div className='md:w-1/2 flex justify-between items-center'>
                <div className='flex items-center gap-2'>
                  <p className={`min-w-2 h-2 rounded-full ${
                    item.status === 'cancelled' ? 'bg-red-500' :
                    item.status === 'ready' ? 'bg-green-500' : 'bg-yellow-500'
                  }`}></p>
                  <p className='text-sm md:text-base'>{item.status}</p>
                </div>
                <div className="flex items-center gap-3">
                  {item.type === 'preorder' && !['cancelled', 'ready'].includes(item.status) && (
                    <button 
                      onClick={() => handleDeletePreorder(item._id, item.status)}
                      className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors"
                      disabled={deletePreorderMutation.isPending}
                    >
                      <BsTrash size={16} />
                    </button>
                  )}
                  <button 
                    onClick={refetchOrders}
                    className={`border px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 flex items-center gap-2
                      ${deletePreorderMutation.isPending ? 'bg-gray-400 text-gray-200 cursor-not-allowed' : ''}`}
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
            <div className="flex justify-center items-center gap-2 mt-8 pb-8">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`p-2 rounded-lg transition-colors ${
                  currentPage === 1 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : 'hover:bg-gray-100'
                }`}
              >
                <ChevronLeft size={20} />
              </button>

              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => handlePageChange(i + 1)}
                  className={`w-8 h-8 rounded-lg transition-colors ${
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
                className={`p-2 rounded-lg transition-colors ${
                  currentPage === totalPages 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : 'hover:bg-gray-100'
                }`}
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default Orders
