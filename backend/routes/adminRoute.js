import express from 'express'
import {
  adminLogin,
  createAdmin,
  getAllAdmins,
  updateAdmin,
  deleteAdmin,
  getAdminProfile
} from '../controllers/adminController.js'
import adminAuth, { requireSuperAdmin } from '../middleware/adminAuth.js'

const adminRouter = express.Router()

// Public routes
adminRouter.post('/login', adminLogin)

// Protected routes (require authentication)
adminRouter.get('/profile', adminAuth, getAdminProfile)

// Super admin only routes
adminRouter.post('/create', adminAuth, requireSuperAdmin, createAdmin)
adminRouter.get('/all', adminAuth, requireSuperAdmin, getAllAdmins)
adminRouter.put('/:adminId', adminAuth, requireSuperAdmin, updateAdmin)
adminRouter.delete('/:adminId', adminAuth, requireSuperAdmin, deleteAdmin)

export default adminRouter
