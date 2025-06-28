import React, { useContext, useState, useEffect } from 'react'
import { ShopContext } from '@/context/ShopContext'
import { toast } from 'sonner'
import axios from 'axios'
import { User, Package, MapPin, CreditCard, Edit, Save, X, Eye, EyeOff } from 'lucide-react'
import { assets } from '@/assets/assets'

const Profile = () => {
  const { token, backendUrl, navigate } = useContext(ShopContext)
  const [activeTab, setActiveTab] = useState('overview')
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // User data states
  const [userInfo, setUserInfo] = useState({
    name: '',
    email: '',
    phone: '',
    dateJoined: ''
  })

  // Activity stats
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSpent: 0,
    averageOrderValue: 0,
    lastOrderDate: null
  })

  // Recent orders
  const [recentOrders, setRecentOrders] = useState([])

  // Delivery info
  const [deliveryInfo, setDeliveryInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipcode: '',
    country: 'Cameroon'
  })

  // Password change
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  // Fetch user profile data
  const fetchUserProfile = async () => {
    try {
      setIsLoading(true)
      const response = await axios.get(`${backendUrl}/api/user/profile`, {
        headers: { token }
      })

      if (response.data.success) {
        const { user, stats, recentOrders, deliveryInfo } = response.data
        setUserInfo(user)
        setStats(stats)
        setRecentOrders(recentOrders)
        if (deliveryInfo) {
          setDeliveryInfo(deliveryInfo)
        }
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast.error('Failed to load profile data')
    } finally {
      setIsLoading(false)
    }
  }

  // Update user info
  const updateUserInfo = async () => {
    try {
      const response = await axios.put(`${backendUrl}/api/user/update-info`, userInfo, {
        headers: { token }
      })

      if (response.data.success) {
        toast.success('Profile updated successfully')
        setIsEditing(false)
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
    }
  }

  // Save delivery info
  const saveDeliveryInfo = async () => {
    try {
      const response = await axios.put(`${backendUrl}/api/user/delivery-info`, deliveryInfo, {
        headers: { token }
      })

      if (response.data.success) {
        toast.success('Delivery information saved successfully')
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      console.error('Error saving delivery info:', error)
      toast.error('Failed to save delivery information')
    }
  }

  // Change password
  const changePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long')
      return
    }

    try {
      const response = await axios.put(`${backendUrl}/api/user/change-password`, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      }, {
        headers: { token }
      })

      if (response.data.success) {
        toast.success('Password changed successfully')
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      console.error('Error changing password:', error)
      toast.error('Failed to change password')
    }
  }

  useEffect(() => {
    if (!token) {
      navigate('/login')
      return
    }
    fetchUserProfile()
  }, [token])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-brand"></div>
      </div>
    )
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-3 sm:space-y-0 sm:space-x-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-brand rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </div>
            <div className="text-center sm:text-left">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{userInfo.name}</h1>
              <p className="text-gray-600 text-sm sm:text-base">{userInfo.email}</p>
              <p className="text-xs sm:text-sm text-gray-500">Member since {formatDate(userInfo.dateJoined)}</p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-4 sm:mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex overflow-x-auto px-3 sm:px-6">
              {[
                { id: 'overview', label: 'Overview', icon: User },
                { id: 'orders', label: 'Orders', icon: Package },
                { id: 'delivery', label: 'Delivery', icon: MapPin },
                { id: 'security', label: 'Security', icon: CreditCard }
              ].map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-1 sm:space-x-2 py-3 sm:py-4 px-2 sm:px-4 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'border-brand text-brand'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-4 sm:space-y-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {/* Stats Cards */}
              <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                    <Package className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                  </div>
                  <div className="ml-3 sm:ml-4 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Total Orders</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                    <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                  </div>
                  <div className="ml-3 sm:ml-4 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Total Spent</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{formatCurrency(stats.totalSpent)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
                    <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                  </div>
                  <div className="ml-3 sm:ml-4 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Average Order</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{formatCurrency(stats.averageOrderValue)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-orange-100 rounded-lg flex-shrink-0">
                    <Package className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
                  </div>
                  <div className="ml-3 sm:ml-4 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Last Order</p>
                    <p className="text-xs sm:text-sm font-bold text-gray-900">
                      {stats.lastOrderDate ? formatDate(stats.lastOrderDate) : 'No orders yet'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Personal Information */}
              <div className="sm:col-span-2 lg:col-span-4 bg-white rounded-lg shadow-sm p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 space-y-2 sm:space-y-0">
                  <h3 className="text-base sm:text-lg font-medium text-gray-900">Personal Information</h3>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="flex items-center space-x-2 text-brand hover:text-brand-dark self-start sm:self-auto"
                  >
                    {isEditing ? <X className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                    <span className="text-sm sm:text-base">{isEditing ? 'Cancel' : 'Edit'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={userInfo.name}
                        onChange={(e) => setUserInfo({ ...userInfo, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand text-sm sm:text-base"
                      />
                    ) : (
                      <p className="text-gray-900 text-sm sm:text-base">{userInfo.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <p className="text-gray-900 text-sm sm:text-base break-all">{userInfo.email}</p>
                    <p className="text-xs text-gray-500">Email cannot be changed</p>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={userInfo.phone}
                        onChange={(e) => setUserInfo({ ...userInfo, phone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand text-sm sm:text-base"
                        placeholder="Enter phone number"
                      />
                    ) : (
                      <p className="text-gray-900 text-sm sm:text-base">{userInfo.phone || 'Not provided'}</p>
                    )}
                  </div>
                </div>

                {isEditing && (
                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={updateUserInfo}
                      className="flex items-center space-x-2 bg-brand text-white px-4 py-2 rounded-md hover:bg-brand-dark text-sm sm:text-base"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save Changes</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4 sm:mb-6">Recent Orders</h3>
              {recentOrders.length > 0 ? (
                <div className="space-y-3 sm:space-y-4">
                  {recentOrders.map((order) => (
                    <div key={order._id} className="border border-gray-200 rounded-lg p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 space-y-2 sm:space-y-0">
                        <div>
                          <p className="font-medium text-gray-900 text-sm sm:text-base">Order #{order._id.slice(-8)}</p>
                          <p className="text-xs sm:text-sm text-gray-600">{formatDate(order.date)}</p>
                        </div>
                        <div className="text-left sm:text-right">
                          <p className="font-medium text-gray-900 text-sm sm:text-base">{formatCurrency(order.amount)}</p>
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            order.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                            order.status === 'Shipped' ? 'bg-blue-100 text-blue-800' :
                            order.status === 'Processing' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-gray-600 mb-2">
                        <span>{order.items?.length || 0} items</span>
                        <span>•</span>
                        <span className="truncate">{order.paymentMethod}</span>
                      </div>
                      <button
                        onClick={() => navigate(`/orders`)}
                        className="text-brand hover:text-brand-dark text-xs sm:text-sm font-medium"
                      >
                        View Details →
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 sm:py-8">
                  <Package className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                  <p className="text-gray-600 text-sm sm:text-base mb-3 sm:mb-4">No orders found</p>
                  <button
                    onClick={() => navigate('/collection')}
                    className="bg-brand text-white px-4 py-2 rounded-md hover:bg-brand-dark text-sm sm:text-base"
                  >
                    Start Shopping
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Delivery Info Tab */}
          {activeTab === 'delivery' && (
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 space-y-2 sm:space-y-0">
                <h3 className="text-base sm:text-lg font-medium text-gray-900">Saved Delivery Information</h3>
                <p className="text-xs sm:text-sm text-gray-600">This information will be used for future orders</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                  <input
                    type="text"
                    value={deliveryInfo.firstName}
                    onChange={(e) => setDeliveryInfo({ ...deliveryInfo, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand text-sm sm:text-base"
                    placeholder="Enter first name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                  <input
                    type="text"
                    value={deliveryInfo.lastName}
                    onChange={(e) => setDeliveryInfo({ ...deliveryInfo, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand text-sm sm:text-base"
                    placeholder="Enter last name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={deliveryInfo.email}
                    onChange={(e) => setDeliveryInfo({ ...deliveryInfo, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand text-sm sm:text-base"
                    placeholder="Enter email address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={deliveryInfo.phone}
                    onChange={(e) => setDeliveryInfo({ ...deliveryInfo, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand text-sm sm:text-base"
                    placeholder="Enter phone number"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  <input
                    type="text"
                    value={deliveryInfo.address}
                    onChange={(e) => setDeliveryInfo({ ...deliveryInfo, address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand text-sm sm:text-base"
                    placeholder="Enter street address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                  <input
                    type="text"
                    value={deliveryInfo.city}
                    onChange={(e) => setDeliveryInfo({ ...deliveryInfo, city: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand text-sm sm:text-base"
                    placeholder="Enter city"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">State/Region</label>
                  <input
                    type="text"
                    value={deliveryInfo.state}
                    onChange={(e) => setDeliveryInfo({ ...deliveryInfo, state: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand text-sm sm:text-base"
                    placeholder="Enter state or region"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ZIP/Postal Code</label>
                  <input
                    type="text"
                    value={deliveryInfo.zipcode}
                    onChange={(e) => setDeliveryInfo({ ...deliveryInfo, zipcode: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand text-sm sm:text-base"
                    placeholder="Enter ZIP or postal code"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                  <select
                    value={deliveryInfo.country}
                    onChange={(e) => setDeliveryInfo({ ...deliveryInfo, country: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand text-sm sm:text-base"
                  >
                    <option value="Cameroon">Cameroon</option>
                    <option value="Nigeria">Nigeria</option>
                    <option value="Chad">Chad</option>
                    <option value="Central African Republic">Central African Republic</option>
                    <option value="Equatorial Guinea">Equatorial Guinea</option>
                    <option value="Gabon">Gabon</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-center sm:justify-end">
                <button
                  onClick={saveDeliveryInfo}
                  className="flex items-center space-x-2 bg-brand text-white px-4 sm:px-6 py-2 rounded-md hover:bg-brand-dark text-sm sm:text-base w-full sm:w-auto justify-center"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Delivery Information</span>
                </button>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4 sm:mb-6">Change Password</h3>

              <div className="max-w-md space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand text-sm sm:text-base"
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand text-sm sm:text-base"
                    placeholder="Enter new password"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand text-sm sm:text-base"
                    placeholder="Confirm new password"
                  />
                </div>

                <button
                  onClick={changePassword}
                  className="w-full bg-brand text-white px-4 py-2 rounded-md hover:bg-brand-dark text-sm sm:text-base"
                >
                  Change Password
                </button>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-200">
                <h4 className="text-md font-medium text-gray-900 mb-4">Account Security</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Two-factor authentication</span>
                    <span className="text-sm text-gray-400">Coming soon</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Login notifications</span>
                    <span className="text-sm text-gray-400">Coming soon</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Profile
