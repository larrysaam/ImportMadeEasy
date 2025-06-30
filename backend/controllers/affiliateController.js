import affiliateModel from '../models/affiliateModel.js'
import referralModel from '../models/referralModel.js'
import userModel from '../models/userModel.js'
import jwt from 'jsonwebtoken'

// Apply for affiliate program
const applyAffiliate = async (req, res) => {
  try {
    const userId = req.authenticatedUserId || req.userId || req.body.userId
    const applicationData = req.body

    if (!userId) {
      return res.json({
        success: false,
        message: 'User ID not found. Please login again.'
      })
    }

    // Check if user already has an affiliate application
    const existingAffiliate = await affiliateModel.findOne({ userId })
    if (existingAffiliate) {
      return res.json({
        success: false,
        message: 'You have already applied for the affiliate program'
      })
    }

    // Generate unique affiliate code
    let affiliateCode
    let isUnique = false

    while (!isUnique) {
      // Generate a 8-character code
      affiliateCode = Math.random().toString(36).substring(2, 10).toUpperCase()

      // Check if code already exists
      const existingCode = await affiliateModel.findOne({ affiliateCode })
      if (!existingCode) {
        isUnique = true
      }
    }

    // Create new affiliate application
    const affiliate = new affiliateModel({
      userId,
      affiliateCode,
      applicationData,
      status: 'pending'
    })

    await affiliate.save()

    res.json({
      success: true,
      message: 'Affiliate application submitted successfully',
      affiliate: {
        id: affiliate._id,
        status: affiliate.status,
        affiliateCode: affiliate.affiliateCode
      }
    })

  } catch (error) {
    console.error('Error applying for affiliate program:', error)
    res.json({
      success: false,
      message: 'Failed to submit affiliate application'
    })
  }
}

// Get affiliate dashboard data
const getAffiliateDashboard = async (req, res) => {
  try {
    const userId = req.authenticatedUserId || req.userId || req.body.userId

    const affiliate = await affiliateModel.findOne({ userId }).populate('userId', 'name email')
    if (!affiliate) {
      return res.json({
        success: false,
        message: 'Affiliate account not found'
      })
    }

    // Get recent referrals
    const recentReferrals = await referralModel.find({ affiliateId: affiliate._id })
      .populate('userId', 'name email')
      .populate('orderId', 'amount date')
      .sort({ createdAt: -1 })
      .limit(10)

    // Get monthly stats (current month)
    const currentMonth = new Date()
    currentMonth.setDate(1)
    currentMonth.setHours(0, 0, 0, 0)

    const monthlyStats = await referralModel.aggregate([
      {
        $match: {
          affiliateId: affiliate._id,
          createdAt: { $gte: currentMonth }
        }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          totalCommission: { $sum: '$commission' }
        }
      }
    ])

    const dashboardData = {
      affiliate: {
        id: affiliate._id,
        status: affiliate.status,
        affiliateCode: affiliate.affiliateCode,
        affiliateLink: `${process.env.FRONTEND_URL}/register?ref=${affiliate.affiliateCode}`,
        commissionRate: affiliate.commissionRate,
        stats: affiliate.stats,
        nextPayoutAmount: affiliate.nextPayoutAmount,
        lastPayoutDate: affiliate.lastPayoutDate
      },
      recentReferrals,
      monthlyStats: {
        clicks: monthlyStats.find(s => s._id === 'click')?.count || 0,
        signups: monthlyStats.find(s => s._id === 'signup')?.count || 0,
        sales: monthlyStats.find(s => s._id === 'purchase')?.count || 0,
        earnings: monthlyStats.find(s => s._id === 'purchase')?.totalCommission || 0
      }
    }

    res.json({
      success: true,
      data: dashboardData
    })

  } catch (error) {
    console.error('Error getting affiliate dashboard:', error)
    res.json({
      success: false,
      message: 'Failed to load dashboard data'
    })
  }
}

// Track affiliate click
const trackClick = async (req, res) => {
  try {
    const { affiliateCode } = req.params
    const metadata = {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      referrer: req.get('Referer')
    }

    const referral = await referralModel.trackClick(affiliateCode, metadata)
    
    if (referral) {
      res.json({
        success: true,
        message: 'Click tracked successfully'
      })
    } else {
      res.json({
        success: false,
        message: 'Invalid affiliate code'
      })
    }

  } catch (error) {
    console.error('Error tracking click:', error)
    res.json({
      success: false,
      message: 'Failed to track click'
    })
  }
}

// Get affiliate by code (for validation)
const getAffiliateByCode = async (req, res) => {
  try {
    const { code } = req.params

    const affiliate = await affiliateModel.findOne({ 
      affiliateCode: code.toUpperCase(),
      status: 'approved',
      isActive: true
    }).select('affiliateCode applicationData.fullName')

    if (affiliate) {
      res.json({
        success: true,
        affiliate: {
          code: affiliate.affiliateCode,
          name: affiliate.applicationData.fullName
        }
      })
    } else {
      res.json({
        success: false,
        message: 'Invalid affiliate code'
      })
    }

  } catch (error) {
    console.error('Error getting affiliate by code:', error)
    res.json({
      success: false,
      message: 'Failed to validate affiliate code'
    })
  }
}

// Admin: Get all affiliate applications
const getAllAffiliates = async (req, res) => {
  try {
    console.log('getAllAffiliates called with query:', req.query)
    const { page = 1, limit = 10, status, search } = req.query

    const query = {}
    if (status && status !== 'all') {
      query.status = status
    }

    // Add search functionality
    if (search) {
      query.$or = [
        { 'applicationData.fullName': { $regex: search, $options: 'i' } },
        { 'applicationData.email': { $regex: search, $options: 'i' } },
        { 'affiliateCode': { $regex: search, $options: 'i' } }
      ]
    }

    console.log('Query object:', query)

    const affiliates = await affiliateModel.find(query)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const total = await affiliateModel.countDocuments(query)

    console.log(`Found ${affiliates.length} affiliates out of ${total} total`)

    // Calculate stats
    const stats = {
      total: await affiliateModel.countDocuments(),
      pending: await affiliateModel.countDocuments({ status: 'pending' }),
      approved: await affiliateModel.countDocuments({ status: 'approved' }),
      rejected: await affiliateModel.countDocuments({ status: 'rejected' }),
      suspended: await affiliateModel.countDocuments({ status: 'suspended' })
    }

    res.json({
      success: true,
      affiliates,
      stats,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    })

  } catch (error) {
    console.error('Error getting affiliates:', error)
    res.json({
      success: false,
      message: 'Failed to get affiliates',
      error: error.message
    })
  }
}

// Admin: Approve/Reject affiliate
const updateAffiliateStatus = async (req, res) => {
  try {
    const { affiliateId } = req.params
    const { status, rejectionReason, notes } = req.body



    if (!affiliateId) {
      return res.json({
        success: false,
        message: 'Affiliate ID is required'
      })
    }

    if (!status) {
      return res.json({
        success: false,
        message: 'Status is required'
      })
    }

    if (!['approved', 'rejected', 'suspended'].includes(status)) {
      return res.json({
        success: false,
        message: 'Invalid status value'
      })
    }

    // First check if affiliate exists
    const existingAffiliate = await affiliateModel.findById(affiliateId)
    if (!existingAffiliate) {
      return res.json({
        success: false,
        message: 'Affiliate not found'
      })
    }

    const updateData = { status, notes }

    if (status === 'approved') {
      updateData.approvedAt = new Date()
    } else if (status === 'rejected') {
      updateData.rejectedAt = new Date()
      updateData.rejectionReason = rejectionReason
    }

    const affiliate = await affiliateModel.findByIdAndUpdate(
      affiliateId,
      updateData,
      { new: true }
    ).populate('userId', 'name email')

    if (!affiliate) {
      return res.json({
        success: false,
        message: 'Affiliate not found'
      })
    }

    res.json({
      success: true,
      message: `Affiliate ${status} successfully`,
      affiliate
    })

  } catch (error) {
    console.error('Error updating affiliate status:', error)
    res.json({
      success: false,
      message: 'Failed to update affiliate status'
    })
  }
}

// Get affiliate stats for a specific period
const getAffiliateStats = async (req, res) => {
  try {
    const userId = req.authenticatedUserId || req.userId || req.body.userId
    const { period = '30' } = req.query // days

    const affiliate = await affiliateModel.findOne({ userId })
    if (!affiliate) {
      return res.json({
        success: false,
        message: 'Affiliate account not found'
      })
    }

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parseInt(period))

    const stats = await referralModel.aggregate([
      {
        $match: {
          affiliateId: affiliate._id,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            type: '$type',
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
          },
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          totalCommission: { $sum: '$commission' }
        }
      },
      {
        $sort: { '_id.date': 1 }
      }
    ])

    res.json({
      success: true,
      stats
    })

  } catch (error) {
    console.error('Error getting affiliate stats:', error)
    res.json({
      success: false,
      message: 'Failed to get affiliate stats'
    })
  }
}

// Create test affiliate (for development/testing)
const createTestAffiliate = async (req, res) => {
  try {
    // Check if test affiliate already exists
    const existingTest = await affiliateModel.findOne({ affiliateCode: 'TEST123' })
    if (existingTest) {
      return res.json({
        success: false,
        message: 'Test affiliate already exists'
      })
    }

    // Create a test user first (if needed)
    let testUser = await userModel.findOne({ email: 'test@affiliate.com' })
    if (!testUser) {
      testUser = new userModel({
        name: 'Test Affiliate User',
        email: 'test@affiliate.com',
        password: 'hashedpassword123' // In real scenario, this should be properly hashed
      })
      await testUser.save()
    }

    // Create test affiliate
    const testAffiliate = new affiliateModel({
      userId: testUser._id,
      affiliateCode: 'TEST123',
      status: 'pending',
      applicationData: {
        fullName: 'Test Affiliate User',
        email: 'test@affiliate.com',
        phone: '+1234567890',
        website: 'https://testwebsite.com',
        socialMedia: '@testaffiliate',
        experience: 'I have 2 years of experience in digital marketing',
        reason: 'I want to promote your products because I believe in their quality',
        trafficSource: 'instagram'
      },
      stats: {
        totalClicks: 25,
        totalSignups: 5,
        totalSales: 2,
        totalEarnings: 150,
        conversionRate: 20
      }
    })

    await testAffiliate.save()

    res.json({
      success: true,
      message: 'Test affiliate created successfully',
      affiliate: testAffiliate
    })

  } catch (error) {
    console.error('Error creating test affiliate:', error)
    res.json({
      success: false,
      message: 'Failed to create test affiliate',
      error: error.message
    })
  }
}

export {
  applyAffiliate,
  getAffiliateDashboard,
  trackClick,
  getAffiliateByCode,
  getAllAffiliates,
  updateAffiliateStatus,
  getAffiliateStats,
  createTestAffiliate
}
