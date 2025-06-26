import React, { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { backendUrl } from '../App'
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Download
} from 'lucide-react'

const AffiliateManagement = ({ token }) => {
  const [affiliates, setAffiliates] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedAffiliate, setSelectedAffiliate] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showActionModal, setShowActionModal] = useState(false)
  const [actionType, setActionType] = useState('') // 'approve', 'reject', 'suspend'
  const [actionNotes, setActionNotes] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  
  // Filters and pagination
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    suspended: 0
  })

  useEffect(() => {
    fetchAffiliates()
  }, [currentPage, statusFilter, searchTerm])

  const fetchAffiliates = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm })
      })

      const response = await fetch(`${backendUrl}/api/affiliate/admin/all?${params}`, {
        headers: {
          'token': token
        }
      })

      const data = await response.json()

      if (data.success) {
        setAffiliates(data.affiliates)
        setTotalPages(data.pagination.pages)
        
        // Calculate stats from all affiliates
        const allAffiliatesResponse = await fetch(`${backendUrl}/api/affiliate/admin/all`, {
          headers: {
            'token': token
          }
        })
        
        const allData = await allAffiliatesResponse.json()
        if (allData.success) {
          const statsData = allData.affiliates.reduce((acc, affiliate) => {
            acc.total++
            acc[affiliate.status] = (acc[affiliate.status] || 0) + 1
            return acc
          }, { total: 0, pending: 0, approved: 0, rejected: 0, suspended: 0 })
          
          setStats(statsData)
        }
      } else {
        toast.error(data.message || 'Failed to fetch affiliates')
      }
    } catch (error) {
      console.error('Error fetching affiliates:', error)
      toast.error('Failed to fetch affiliates')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async () => {
    if (!selectedAffiliate || !actionType) return

    try {
      const requestData = {
        status: actionType === 'approve' ? 'approved' : actionType === 'reject' ? 'rejected' : 'suspended',
        notes: actionNotes,
        ...(actionType === 'reject' && { rejectionReason })
      }

      const response = await fetch(`${backendUrl}/api/affiliate/admin/${selectedAffiliate._id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'token': token
        },
        body: JSON.stringify(requestData)
      })

      const data = await response.json()

      if (data.success) {
        toast.success(`Affiliate ${requestData.status} successfully`)
        setShowActionModal(false)
        setActionNotes('')
        setRejectionReason('')
        fetchAffiliates()
      } else {
        toast.error(data.message || 'Failed to update affiliate status')
      }
    } catch (error) {
      console.error('Error updating affiliate status:', error)
      toast.error('Failed to update affiliate status')
    }
  }

  const openActionModal = (affiliate, action) => {
    setSelectedAffiliate(affiliate)
    setActionType(action)
    setShowActionModal(true)
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { text: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
      approved: { text: 'Approved', color: 'bg-green-100 text-green-800' },
      rejected: { text: 'Rejected', color: 'bg-red-100 text-red-800' },
      suspended: { text: 'Suspended', color: 'bg-red-100 text-red-800' }
    }

    const config = statusConfig[status] || statusConfig.pending

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    )
  }

  const formatCurrency = (amount) => {
    // Format currency as FCFA (Central African CFA Franc)
    return new Intl.NumberFormat('fr-CM', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading && affiliates.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-black"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Affiliate Management</h1>
          <p className="text-gray-600 mt-1">Manage affiliate applications and accounts</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg border shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Affiliates</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Users className="h-8 w-8 text-gray-400" />
            </div>
          </div>

          <div className="bg-white rounded-lg border shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-400" />
            </div>
          </div>

          <div className="bg-white rounded-lg border shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </div>

          <div className="bg-white rounded-lg border shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-400" />
            </div>
          </div>

          <div className="bg-white rounded-lg border shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Suspended</p>
                <p className="text-2xl font-bold text-red-600">{stats.suspended}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-400" />
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg border shadow-sm p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by name, email, or affiliate code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
            <button className="sm:w-auto px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Affiliates Table */}
        <div className="bg-white rounded-lg border shadow-sm">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Affiliates</h2>
            <p className="text-sm text-gray-600">Manage affiliate applications and accounts</p>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
              </div>
            ) : affiliates.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Affiliate</th>
                      <th className="text-left py-3 px-4 font-medium">Code</th>
                      <th className="text-left py-3 px-4 font-medium">Status</th>
                      <th className="text-left py-3 px-4 font-medium">Applied</th>
                      <th className="text-left py-3 px-4 font-medium">Stats</th>
                      <th className="text-left py-3 px-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {affiliates.map((affiliate) => (
                      <tr key={affiliate._id} className="border-b hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div>
                            <div className="font-medium">{affiliate.applicationData.fullName}</div>
                            <div className="text-sm text-gray-600">{affiliate.applicationData.email}</div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                            {affiliate.affiliateCode}
                          </code>
                        </td>
                        <td className="py-4 px-4">
                          {getStatusBadge(affiliate.status)}
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-600">
                          {formatDate(affiliate.createdAt)}
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm">
                            <div>Referrals: {affiliate.stats?.totalSignups || 0}</div>
                            <div>Sales: {affiliate.stats?.totalSales || 0}</div>
                            <div>Earnings: {formatCurrency(affiliate.stats?.totalEarnings || 0)}</div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setSelectedAffiliate(affiliate)
                                setShowDetailsModal(true)
                              }}
                              className="p-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded hover:bg-gray-50"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {affiliate.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => openActionModal(affiliate, 'approve')}
                                  className="p-2 text-green-600 hover:text-green-700 border border-green-300 rounded hover:bg-green-50"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => openActionModal(affiliate, 'reject')}
                                  className="p-2 text-red-600 hover:text-red-700 border border-red-300 rounded hover:bg-red-50"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </>
                            )}

                            {affiliate.status === 'approved' && (
                              <button
                                onClick={() => openActionModal(affiliate, 'suspend')}
                                className="p-2 text-red-600 hover:text-red-700 border border-red-300 rounded hover:bg-red-50"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No affiliates found</p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center mt-6 gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>

                <span className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Details Modal */}
        {showDetailsModal && selectedAffiliate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold">Affiliate Details</h2>
                <p className="text-sm text-gray-600">View detailed information about this affiliate</p>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium mb-4">Application Information</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Full Name</label>
                        <p className="text-sm text-gray-600">{selectedAffiliate.applicationData.fullName}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Email</label>
                        <p className="text-sm text-gray-600">{selectedAffiliate.applicationData.email}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Phone</label>
                        <p className="text-sm text-gray-600">{selectedAffiliate.applicationData.phone || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Website</label>
                        <p className="text-sm text-gray-600">{selectedAffiliate.applicationData.website || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Traffic Source</label>
                        <p className="text-sm text-gray-600 capitalize">{selectedAffiliate.applicationData.trafficSource}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-4">Performance Stats</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Affiliate Code</label>
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm">{selectedAffiliate.affiliateCode}</code>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Total Clicks</label>
                        <p className="text-sm text-gray-600">{selectedAffiliate.stats?.totalClicks || 0}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Total Referrals</label>
                        <p className="text-sm text-gray-600">{selectedAffiliate.stats?.totalSignups || 0}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Total Sales</label>
                        <p className="text-sm text-gray-600">{selectedAffiliate.stats?.totalSales || 0}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Total Earnings</label>
                        <p className="text-sm text-green-600 font-medium">{formatCurrency(selectedAffiliate.stats?.totalEarnings || 0)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <label className="text-sm font-medium text-gray-700">Reason for Joining</label>
                  <p className="text-sm text-gray-600 mt-1">{selectedAffiliate.applicationData.reason}</p>
                </div>

                {selectedAffiliate.applicationData.experience && (
                  <div className="mt-4">
                    <label className="text-sm font-medium text-gray-700">Experience</label>
                    <p className="text-sm text-gray-600 mt-1">{selectedAffiliate.applicationData.experience}</p>
                  </div>
                )}
              </div>

              <div className="p-6 border-t flex justify-end">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Action Modal */}
        {showActionModal && selectedAffiliate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-md w-full mx-4">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold">
                  {actionType === 'approve' && 'Approve Affiliate'}
                  {actionType === 'reject' && 'Reject Affiliate'}
                  {actionType === 'suspend' && 'Suspend Affiliate'}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {actionType === 'approve' && 'This will approve the affiliate application and activate their account.'}
                  {actionType === 'reject' && 'This will reject the affiliate application. Please provide a reason.'}
                  {actionType === 'suspend' && 'This will suspend the affiliate account and disable their links.'}
                </p>
              </div>

              <div className="p-6 space-y-4">
                {actionType === 'reject' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rejection Reason *</label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Please explain why this application is being rejected..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Admin Notes</label>
                  <textarea
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    placeholder="Optional notes for internal use..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>
              </div>

              <div className="p-6 border-t flex justify-end gap-4">
                <button
                  onClick={() => setShowActionModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStatusUpdate}
                  disabled={actionType === 'reject' && !rejectionReason.trim()}
                  className={`px-4 py-2 rounded text-white disabled:opacity-50 disabled:cursor-not-allowed ${
                    actionType === 'approve' ? 'bg-green-600 hover:bg-green-700' :
                    actionType === 'reject' ? 'bg-red-600 hover:bg-red-700' :
                    'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {actionType === 'approve' && 'Approve'}
                  {actionType === 'reject' && 'Reject'}
                  {actionType === 'suspend' && 'Suspend'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AffiliateManagement
