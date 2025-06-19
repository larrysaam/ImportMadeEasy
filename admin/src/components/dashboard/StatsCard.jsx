import React from 'react'

const StatsCard = ({ title, value, icon, percentage }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-gray-500 text-sm">{title}</h3>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <div className="bg-gray-100 p-2 rounded-lg">
          {icon}
        </div>
      </div>
      {percentage && (
        <div className="flex items-center mt-4">
          <span className={`text-sm ${percentage > 0 ? 'text-green-500' : 'text-red-500'}`}>
            {percentage}%
          </span>
          <span className="text-gray-400 text-sm ml-2">from last month</span>
        </div>
      )}
    </div>
  )
}

export default StatsCard