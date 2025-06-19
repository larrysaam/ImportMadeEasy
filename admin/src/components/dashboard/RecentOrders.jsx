import React from 'react'
import { format } from 'date-fns'

const RecentOrders = ({ orders }) => {
  const options = { month: 'short', day: '2-digit', year: 'numeric' }

  return (
    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border">
      <h2 className="text-lg font-semibold mb-4">Recent Orders</h2>
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <div className="inline-block min-w-full align-middle">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="border-b">
                <th className="hidden sm:table-cell text-left pb-3 px-3">Order ID</th>
                <th className="text-left pb-3 px-3">Customer</th>
                <th className="text-left pb-3 px-3">Amount</th>
                <th className="text-left pb-3 px-3">Status</th>
                <th className="hidden sm:table-cell text-left pb-3 px-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {orders.map(order => (
                <tr key={order._id} className="border-b hover:bg-gray-50">
                  <td className="hidden sm:table-cell py-2 px-3 text-sm">
                    {order._id.slice(-6)}
                  </td>
                  <td className="py-2 px-3 text-sm">
                    <div className="font-medium">{order.address.firstName}</div>
                    <div className="sm:hidden text-xs text-gray-500">
                      ID: {order._id.slice(-6)}
                    </div>
                    <div className="sm:hidden text-xs text-gray-500">
                      {new Date(order.date).toLocaleDateString('en-US', options)}
                    </div>
                  </td>
                  <td className="py-2 px-3 text-sm">
                    {import.meta.env.VITE_CURRENCY_SYMBOL}{order.amount}
                  </td>
                  <td className="py-2 px-3 text-sm">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      order.status === 'completed' ? 'bg-green-100 text-green-800' :
                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="hidden sm:table-cell py-2 px-3 text-sm">
                    {new Date(order.date).toLocaleDateString('en-US', options)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default RecentOrders