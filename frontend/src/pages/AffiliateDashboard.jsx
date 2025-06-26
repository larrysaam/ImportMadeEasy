import React, { useState, useEffect, useContext } from 'react'
import { ShopContext } from '@/context/ShopContext'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Link, 
  Copy, 
  Eye,
  Calendar,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react'

const AffiliateDashboard = () => {
  const { token, backendUrl } = useContext(ShopContext)
  const navigate = useNavigate()

  const currency = import.meta.env.VITE_CURRENCY_SYMBOL
  const CurrencySign = import.meta.env.VITE_CURRENCY_SYMBOL 
  
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copying, setCopying] = useState(false)

  useEffect(() => {
    if (!token) {
      navigate('/login')
      return
    }
    fetchDashboardData()
  }, [token])

  const fetchDashboardData = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/affiliate/dashboard`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (data.success) {
        setDashboardData(data.data)
      } else {
        if (data.message === 'Affiliate account not found') {
          navigate('/affiliate')
        } else {
          toast.error(data.message || 'Failed to load dashboard')
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (text) => {
    setCopying(true)
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Copied to clipboard!')
    } catch (error) {
      toast.error('Failed to copy to clipboard')
    } finally {
      setCopying(false)
    }
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { variant: 'secondary', icon: Clock, text: 'Pending Review' },
      approved: { variant: 'default', icon: CheckCircle, text: 'Approved' },
      rejected: { variant: 'destructive', icon: XCircle, text: 'Rejected' },
      suspended: { variant: 'destructive', icon: XCircle, text: 'Suspended' }
    }

    const config = statusConfig[status] || statusConfig.pending
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.text}
      </Badge>
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-black"></div>
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-4">You don't have access to the affiliate dashboard.</p>
          <Button onClick={() => navigate('/affiliate')}>
            Apply for Affiliate Program
          </Button>
        </div>
      </div>
    )
  }

  const { affiliate, recentReferrals, monthlyStats } = dashboardData

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Affiliate Dashboard</h1>
              <p className="text-gray-600 mt-1">Welcome back! Here's your affiliate performance overview.</p>
            </div>
            <div className="mt-4 sm:mt-0">
              {getStatusBadge(affiliate.status)}
            </div>
          </div>
        </div>

        {affiliate.status === 'pending' && (
          <Card className="mb-8 border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-yellow-600" />
                <div>
                  <h3 className="font-semibold text-yellow-800">Application Under Review</h3>
                  <p className="text-yellow-700">Your affiliate application is being reviewed. We'll notify you within 2-3 business days.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {affiliate.status === 'approved' && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(affiliate.stats.totalEarnings)}</div>
                  <p className="text-xs text-muted-foreground">
                    Next payout: {formatCurrency(affiliate.nextPayoutAmount)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{affiliate.stats.totalSignups}</div>
                  <p className="text-xs text-muted-foreground">
                    {monthlyStats.signups} this month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{affiliate.stats.totalSales}</div>
                  <p className="text-xs text-muted-foreground">
                    {monthlyStats.sales} this month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{affiliate.stats.conversionRate.toFixed(2)}%</div>
                  <p className="text-xs text-muted-foreground">
                    Commission: {(affiliate.commissionRate * 100).toFixed(1)}%
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Affiliate Links */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link className="w-5 h-5" />
                  Your Affiliate Links
                </CardTitle>
                <CardDescription>
                  Share these links to earn commissions on referrals
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Affiliate Code</label>
                  <div className="flex gap-2 mt-1">
                    <Input value={affiliate.affiliateCode} readOnly />
                    <Button
                      variant="outline"
                      onClick={() => copyToClipboard(affiliate.affiliateCode)}
                      disabled={copying}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Referral Link</label>
                  <div className="flex gap-2 mt-1">
                    <Input value={affiliate.affiliateLink} readOnly />
                    <Button
                      variant="outline"
                      onClick={() => copyToClipboard(affiliate.affiliateLink)}
                      disabled={copying}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Your latest referrals and commissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentReferrals.length > 0 ? (
                  <div className="space-y-4">
                    {recentReferrals.map((referral, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            referral.type === 'signup' ? 'bg-blue-500' :
                            referral.type === 'purchase' ? 'bg-green-500' : 'bg-gray-500'
                          }`} />
                          <div>
                            <p className="font-medium capitalize">{referral.type}</p>
                            <p className="text-sm text-gray-600">
                              {new Date(referral.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        {referral.commission > 0 && (
                          <div className="text-right">
                            <p className="font-medium text-green-600">
                              +{formatCurrency(referral.commission)}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No referrals yet. Start sharing your affiliate link!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}

export default AffiliateDashboard
