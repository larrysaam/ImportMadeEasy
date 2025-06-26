import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { backendUrl } from '../App'
import StatsCard from '@/components/dashboard/StatsCard'
import RevenueChart from '@/components/dashboard/RevenueChart'
import UserManagement from '@/components/dashboard/UserManagement'
import { 
  BsBag, 
  BsPeople,
  BsCurrencyDollar,
  BsCart3 
} from 'react-icons/bs'

const Dashboard = ({ token }) => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalPreorders: 0,
    totalUsers: 0,
    totalRevenue: 0,
    revenueData: []
  })

  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await axios.get(`${backendUrl}/api/admin/dashboard`, {
          headers: { token }
        })
        if (response.data.success) {
          setStats(response.data.stats)
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      }
    }

    fetchDashboardData()
  }, [token])

  return (
    <div className="sm:p-6 p-0">
      <h1 className="text-2xl font-bold mb-6">Dashboard Overview</h1>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatsCard
          title="Total Products"
          value={stats.totalProducts}
          icon={<BsBag size={20} />}
          percentage={12}
        />
        <StatsCard
          title="Total Orders"
          value={stats.totalOrders}
          icon={<BsCart3 size={20} />}
          percentage={8}
        />
        <StatsCard
          title="Total Pre-Orders"
          value={stats.totalPreorders}
          icon={<BsCart3 size={20} />}
          percentage={8}
        />
        <StatsCard
          title="Total Users"
          value={stats.totalUsers}
          icon={<BsPeople size={20} />}
          percentage={5}
        />
        <StatsCard
          title="Total Revenue"
          value={`${import.meta.env.VITE_CURRENCY_SYMBOL} ${stats.totalRevenue.toLocaleString()}`}
          icon={<BsCurrencyDollar size={20} />}
          percentage={15}
        />
      </div>

    {console.log("revenue chart : ",stats.revenueData)}
      {/* Revenue Chart */}
      <div className="mb-6">
        <RevenueChart data={stats.revenueData} />
      </div>

      {/* User Management */}
      <div>
        <UserManagement token={token} />
      </div>
    </div>
  )
}

export default Dashboard