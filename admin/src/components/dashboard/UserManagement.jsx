import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { backendUrl } from '../../App'
import { toast } from 'sonner'
import { BsTrash, BsEye, BsSearch } from 'react-icons/bs'

const UserManagement = ({ token }) => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [userToDelete, setUserToDelete] = useState(null)
  const [showUserModal, setShowUserModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [userStats, setUserStats] = useState(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${backendUrl}/api/admin/users`, {
        headers: { token }
      })
      if (response.data.success) {
        setUsers(response.data.users)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  const fetchUserStats = async (userId) => {
    try {
      const response = await axios.get(`${backendUrl}/api/admin/users/${userId}/stats`, {
        headers: { token }
      })
      if (response.data.success) {
        setUserStats(response.data.stats)
      }
    } catch (error) {
      console.error('Error fetching user stats:', error)
    }
  }

  const handleDeleteUser = async () => {
    try {
      const response = await axios.delete(`${backendUrl}/api/admin/users/${userToDelete._id}`, {
        headers: { token }
      })
      if (response.data.success) {
        toast.success('User deleted successfully')
        setUsers(users.filter(user => user._id !== userToDelete._id))
        setShowDeleteModal(false)
        setUserToDelete(null)
      } else {
        toast.error(response.data.message || 'Failed to delete user')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error('Failed to delete user')
    }
  }

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
          <h2 className="text-lg font-semibold">User Management</h2>
          <div className="relative w-full sm:w-64">
            <BsSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="inline-block min-w-full align-middle">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="border-b">
                  <th className="text-left pb-3 px-3 font-medium text-gray-700">Name</th>
                  <th className="text-left pb-3 px-3 font-medium text-gray-700">Email</th>
                  <th className="hidden sm:table-cell text-left pb-3 px-3 font-medium text-gray-700">Joined</th>
                  <th className="text-left pb-3 px-3 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-gray-500">
                      {searchTerm ? 'No users found matching your search.' : 'No users found.'}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map(user => (
                    <tr key={user._id} className="hover:bg-gray-50">
                      <td className="py-3 px-3 text-sm">
                        <div className="font-medium text-gray-900">{user.name}</div>
                        <div className="sm:hidden text-xs text-gray-500 mt-1">
                          {user.email}
                        </div>
                        <div className="sm:hidden text-xs text-gray-500">
                          Joined: {formatDate(user.date)}
                        </div>
                      </td>
                      <td className="hidden sm:table-cell py-3 px-3 text-sm text-gray-600">
                        {user.email}
                      </td>
                      <td className="hidden sm:table-cell py-3 px-3 text-sm text-gray-600">
                        {formatDate(user.date)}
                      </td>
                      <td className="py-3 px-3 text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedUser(user)
                              setShowUserModal(true)
                              fetchUserStats(user._id)
                            }}
                            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View user details"
                          >
                            <BsEye size={16} />
                          </button>
                          <button
                            onClick={() => {
                              setUserToDelete(user)
                              setShowDeleteModal(true)
                            }}
                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete user"
                          >
                            <BsTrash size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {filteredUsers.length > 0 && (
          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredUsers.length} of {users.length} users
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Delete User</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <strong>{userToDelete?.name}</strong>? 
              This action cannot be undone and will permanently remove the user account and all associated data.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setUserToDelete(null)
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">User Details</h3>

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="text-sm font-medium text-gray-700">Name</label>
                <p className="text-gray-900">{selectedUser.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Email</label>
                <p className="text-gray-900">{selectedUser.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">User ID</label>
                <p className="text-gray-600 text-sm font-mono">{selectedUser._id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Joined Date</label>
                <p className="text-gray-900">{formatDate(selectedUser.date)}</p>
              </div>
            </div>

            {/* User Statistics */}
            {userStats && (
              <div className="border-t pt-4">
                <h4 className="text-md font-semibold mb-3">User Statistics</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm text-blue-600 font-medium">Total Orders</p>
                    <p className="text-xl font-bold text-blue-800">{userStats.totalOrders}</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-sm text-green-600 font-medium">Total Spent</p>
                    <p className="text-xl font-bold text-green-800">
                      FCFA {userStats.totalSpent?.toLocaleString('fr-CM') || 0}
                    </p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <p className="text-sm text-purple-600 font-medium">Pre-Orders</p>
                    <p className="text-xl font-bold text-purple-800">{userStats.totalPreorders}</p>
                  </div>
                  <div className="bg-orange-50 p-3 rounded-lg">
                    <p className="text-sm text-orange-600 font-medium">Last Order</p>
                    <p className="text-sm font-medium text-orange-800">
                      {userStats.lastOrderDate ? formatDate(userStats.lastOrderDate) : 'Never'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end mt-6">
              <button
                onClick={() => {
                  setShowUserModal(false)
                  setSelectedUser(null)
                  setUserStats(null)
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default UserManagement
