import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { backendUrl, currency } from '../App'
import { toast } from "sonner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const Preorders = ({token}) => {
  const [preorders, setPreorders] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const preordersPerPage = 5

  const fetchPreorders = async () => {
    if (!token) return null

    try {
      const response = await axios.get(`${backendUrl}/api/preorder/list`, {
        headers: { token }
      })
      if (response.data.success) {
        setPreorders(response.data.preorders)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch preorders')
    }
  }

  const statusHandler = async (value, preorderId) => {
    try {
      // Update status
      const response = await axios.put(
        `${backendUrl}/api/preorder/status`,
        { preorderId, status: value },
        { headers: { token } }
      )

      if (response.data.success) {
        // Get the preorder details for email
        const preorder = preorders.find(p => p._id === preorderId)
        
        // Send email notification for Confirmed or Cancelled status
        if ((value === 'Confirmed' || value === 'Cancelled') && preorder) {
          await axios.post(
            `${backendUrl}/api/preorder/notify`,
            {
              email: preorder.address.email,
              status: value,
              orderDetails: {
                name: `${preorder.address.firstName} ${preorder.address.lastName}`,
                items: preorder.items,
                orderId: preorderId
              }
            },
            { headers: { token } }
          )
        }

        toast.success(response.data.message)
        fetchPreorders()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status')
    }
  }

  const depositHandler = async (preorderId) => {
    try {
      const response = await axios.put(
        `${backendUrl}/api/preorder/deposit`,
        { preorderId },
        { headers: { token } }
      )

      if (response.data.success) {
        toast.success(response.data.message)
        fetchPreorders()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to validate deposit')
    }
  }

  // Pagination logic
  const indexOfLastPreorder = currentPage * preordersPerPage
  const indexOfFirstPreorder = indexOfLastPreorder - preordersPerPage
  const currentPreorders = preorders.slice(indexOfFirstPreorder, indexOfLastPreorder)
  const totalPages = Math.ceil(preorders.length / preordersPerPage)

  const paginate = (pageNumber) => setCurrentPage(pageNumber)

  useEffect(() => {
    fetchPreorders()
  }, [token])

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Preorders</h1>
      
      <div className="space-y-4">
        {currentPreorders.map((preorder) => (
          <div key={preorder._id} className="border rounded-lg p-3 sm:p-4 space-y-3 sm:space-y-4">
            {/* Stack all sections vertically on mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Customer Details */}
              <div className="bg-gray-50 p-3 rounded-md">
                <h3 className="font-semibold text-sm sm:text-base mb-2">Customer Details</h3>
                <div className="space-y-1 text-sm">
                  <p>{preorder.address.firstName} {preorder.address.lastName}</p>
                  <p className="text-gray-600">{preorder.address.email}</p>
                  <p className="text-gray-600">{preorder.address.phone}</p>
                </div>
              </div>
              
              {/* Items */}
              <div className="bg-gray-50 p-3 rounded-md">
                <h3 className="font-semibold text-sm sm:text-base mb-2">Items</h3>
                <div className="space-y-1 text-sm">
                  {preorder.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-start">
                      <div className="flex-grow">
                        <span>{item.name} - {item.size}</span>
                        {item.color && (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <span>Color: {item.color}</span>
                            {item.colorHex && (
                              <div
                                className="w-3 h-3 rounded-full border border-gray-300"
                                style={{ backgroundColor: item.colorHex }}
                                title={item.color}
                              ></div>
                            )}
                          </div>
                        )}
                      </div>
                      <span className="text-gray-600 ml-2">x{item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Deposit */}
              <div className="bg-gray-50 p-3 rounded-md">
                <h3 className="font-semibold text-sm sm:text-base mb-2">Deposit</h3>
                <div className="space-y-1 text-sm">
                  <p className="flex justify-between">
                    <span>Amount:</span>
                    <span>{currency}{preorder.items[0].price}</span>
                  </p>
                  <p className="flex justify-between">
                    <span>Status:</span>
                    <span className={preorder.payment ? 'text-green-600' : 'text-orange-600'}>
                      {preorder.payment ? 'Paid' : 'Pending'}
                    </span>
                  </p>
                  {!preorder.payment && preorder.status !== 'Cancelled' && (
                    <button
                      onClick={() => depositHandler(preorder._id)}
                      className="w-full mt-2 px-3 py-2 bg-green-500 text-white rounded-md text-sm hover:bg-green-600 transition-colors"
                    >
                      Validate Deposit
                    </button>
                  )}
                </div>
              </div>

              {/* Status */}
              <div className="bg-gray-50 p-3 rounded-md">
                <h3 className="font-semibold text-sm sm:text-base mb-2">Status</h3>
                <Select
                  defaultValue={preorder.status}
                  onValueChange={(value) => statusHandler(value, preorder._id)}
                >
                  <SelectTrigger className="w-full text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Confirmed">Confirmed</SelectItem>
                    <SelectItem value="Processing">Processing</SelectItem>
                    <SelectItem value="Ready">Ready</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Mobile-friendly pagination */}
      {preorders.length > preordersPerPage && (
        <div className="flex flex-wrap justify-center gap-2 mt-6">
          <button
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>
          
          {[...Array(totalPages)].map((_, index) => (
            <button
              key={index + 1}
              onClick={() => paginate(index + 1)}
              className={`px-4 py-2 text-sm border rounded-md hover:bg-gray-50
                ${currentPage === index + 1 ? 'bg-gray-200' : ''}`}
            >
              {index + 1}
            </button>
          ))}

          <button
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}

export default Preorders