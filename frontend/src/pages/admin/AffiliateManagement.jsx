import React, { useState, useEffect, useContext } from 'react'
import { ShopContext } from '@/context/ShopContext'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Edit,
  Trash2,
  Search,
  Filter,
  Download
} from 'lucide-react'

const AffiliateManagement = () => {
  const { token, backendUrl } = useContext(ShopContext)
  
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
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (data.success) {
        setAffiliates(data.affiliates)
        setTotalPages(data.pagination.pages)
        
        // Calculate stats
        const statsData = data.affiliates.reduce((acc, affiliate) => {
          acc.total++
          acc[affiliate.status]++
          return acc
        }, { total: 0, pending: 0, approved: 0, rejected: 0, suspended: 0 })
        
        setStats(statsData)
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
          'Authorization': `Bearer ${token}`
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
      pending: { variant: 'secondary', icon: Clock, text: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
      approved: { variant: 'default', icon: CheckCircle, text: 'Approved', color: 'bg-green-100 text-green-800' },
      rejected: { variant: 'destructive', icon: XCircle, text: 'Rejected', color: 'bg-red-100 text-red-800' },
      suspended: { variant: 'destructive', icon: XCircle, text: 'Suspended', color: 'bg-red-100 text-red-800' }
    }

    const config = statusConfig[status] || statusConfig.pending
    const Icon = config.icon

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3" />
        {config.text}
      </span>
    )
  }

  const formatCurrency = (amount) => {
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
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Affiliates</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Suspended</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.suspended}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by name, email, or affiliate code..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="sm:w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" className="sm:w-auto">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Affiliates Table */}
        <Card>
          <CardHeader>
            <CardTitle>Affiliates</CardTitle>
            <CardDescription>
              Manage affiliate applications and accounts
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedAffiliate(affiliate)
                                setShowDetailsModal(true)
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>

                            {affiliate.status === 'pending' && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-green-600 hover:text-green-700"
                                  onClick={() => openActionModal(affiliate, 'approve')}
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700"
                                  onClick={() => openActionModal(affiliate, 'reject')}
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </>
                            )}

                            {affiliate.status === 'approved' && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                                onClick={() => openActionModal(affiliate, 'suspend')}
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
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
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>

                <span className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>

                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Details Modal */}
        <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Affiliate Details</DialogTitle>
              <DialogDescription>
                View detailed information about this affiliate
              </DialogDescription>
            </DialogHeader>

            {selectedAffiliate && (
              <Tabs defaultValue="application" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="application">Application</TabsTrigger>
                  <TabsTrigger value="performance">Performance</TabsTrigger>
                  <TabsTrigger value="history">History</TabsTrigger>
                </TabsList>

                <TabsContent value="application" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Full Name</Label>
                      <p className="text-sm text-gray-600">{selectedAffiliate.applicationData.fullName}</p>
                    </div>
                    <div>
                      <Label>Email</Label>
                      <p className="text-sm text-gray-600">{selectedAffiliate.applicationData.email}</p>
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <p className="text-sm text-gray-600">{selectedAffiliate.applicationData.phone || 'Not provided'}</p>
                    </div>
                    <div>
                      <Label>Website</Label>
                      <p className="text-sm text-gray-600">{selectedAffiliate.applicationData.website || 'Not provided'}</p>
                    </div>
                    <div>
                      <Label>Traffic Source</Label>
                      <p className="text-sm text-gray-600 capitalize">{selectedAffiliate.applicationData.trafficSource}</p>
                    </div>
                    <div>
                      <Label>Affiliate Code</Label>
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm">{selectedAffiliate.affiliateCode}</code>
                    </div>
                  </div>

                  <div>
                    <Label>Social Media</Label>
                    <p className="text-sm text-gray-600">{selectedAffiliate.applicationData.socialMedia || 'Not provided'}</p>
                  </div>

                  <div>
                    <Label>Experience</Label>
                    <p className="text-sm text-gray-600">{selectedAffiliate.applicationData.experience || 'Not provided'}</p>
                  </div>

                  <div>
                    <Label>Reason for Joining</Label>
                    <p className="text-sm text-gray-600">{selectedAffiliate.applicationData.reason}</p>
                  </div>
                </TabsContent>

                <TabsContent value="performance" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Total Clicks</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{selectedAffiliate.stats?.totalClicks || 0}</div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Total Referrals</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{selectedAffiliate.stats?.totalSignups || 0}</div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Total Sales</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{selectedAffiliate.stats?.totalSales || 0}</div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Total Earnings</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                          {formatCurrency(selectedAffiliate.stats?.totalEarnings || 0)}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Conversion Rate</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {(selectedAffiliate.stats?.conversionRate || 0).toFixed(2)}%
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div>
                    <Label>Commission Rate</Label>
                    <p className="text-sm text-gray-600">{(selectedAffiliate.commissionRate * 100).toFixed(1)}%</p>
                  </div>

                  <div>
                    <Label>Affiliate Link</Label>
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm break-all">
                      {selectedAffiliate.affiliateLink}
                    </code>
                  </div>
                </TabsContent>

                <TabsContent value="history" className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Application Submitted</span>
                      <span className="text-sm text-gray-600">{formatDate(selectedAffiliate.createdAt)}</span>
                    </div>

                    {selectedAffiliate.approvedAt && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Approved</span>
                        <span className="text-sm text-gray-600">{formatDate(selectedAffiliate.approvedAt)}</span>
                      </div>
                    )}

                    {selectedAffiliate.rejectedAt && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Rejected</span>
                        <span className="text-sm text-gray-600">{formatDate(selectedAffiliate.rejectedAt)}</span>
                      </div>
                    )}

                    {selectedAffiliate.rejectionReason && (
                      <div>
                        <Label>Rejection Reason</Label>
                        <p className="text-sm text-gray-600">{selectedAffiliate.rejectionReason}</p>
                      </div>
                    )}

                    {selectedAffiliate.notes && (
                      <div>
                        <Label>Admin Notes</Label>
                        <p className="text-sm text-gray-600">{selectedAffiliate.notes}</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </DialogContent>
        </Dialog>

        {/* Action Modal */}
        <Dialog open={showActionModal} onOpenChange={setShowActionModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {actionType === 'approve' && 'Approve Affiliate'}
                {actionType === 'reject' && 'Reject Affiliate'}
                {actionType === 'suspend' && 'Suspend Affiliate'}
              </DialogTitle>
              <DialogDescription>
                {actionType === 'approve' && 'This will approve the affiliate application and activate their account.'}
                {actionType === 'reject' && 'This will reject the affiliate application. Please provide a reason.'}
                {actionType === 'suspend' && 'This will suspend the affiliate account and disable their links.'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {actionType === 'reject' && (
                <div>
                  <Label htmlFor="rejectionReason">Rejection Reason *</Label>
                  <Textarea
                    id="rejectionReason"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Please explain why this application is being rejected..."
                    rows={3}
                  />
                </div>
              )}

              <div>
                <Label htmlFor="actionNotes">Admin Notes</Label>
                <Textarea
                  id="actionNotes"
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder="Optional notes for internal use..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-4">
                <Button
                  variant="outline"
                  onClick={() => setShowActionModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleStatusUpdate}
                  className={
                    actionType === 'approve' ? 'bg-green-600 hover:bg-green-700' :
                    actionType === 'reject' ? 'bg-red-600 hover:bg-red-700' :
                    'bg-red-600 hover:bg-red-700'
                  }
                  disabled={actionType === 'reject' && !rejectionReason.trim()}
                >
                  {actionType === 'approve' && 'Approve'}
                  {actionType === 'reject' && 'Reject'}
                  {actionType === 'suspend' && 'Suspend'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default AffiliateManagement
