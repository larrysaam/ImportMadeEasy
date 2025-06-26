import express from 'express'
import {
  applyAffiliate,
  getAffiliateDashboard,
  trackClick,
  getAffiliateByCode,
  getAllAffiliates,
  updateAffiliateStatus,
  getAffiliateStats
} from '../controllers/affiliateController.js'
import authUser from '../middleware/auth.js'
import adminAuth from '../middleware/adminAuth.js'

const affiliateRouter = express.Router()

// Public routes
affiliateRouter.get('/validate/:code', getAffiliateByCode)
affiliateRouter.post('/track/:affiliateCode', trackClick)

// User routes (require authentication)
affiliateRouter.post('/apply', authUser, applyAffiliate)
affiliateRouter.get('/dashboard', authUser, getAffiliateDashboard)
affiliateRouter.get('/stats', authUser, getAffiliateStats)

// Admin routes (require admin authentication)
affiliateRouter.get('/admin/all', adminAuth, getAllAffiliates)
affiliateRouter.put('/admin/:affiliateId/status', adminAuth, updateAffiliateStatus)

export default affiliateRouter
