import express from 'express'
import { 
  getUserProfile, 
  updateUserInfo, 
  saveDeliveryInfo, 
  changePassword,
  getUserStats 
} from '../controllers/userProfileController.js'
import authUser from '../middleware/auth.js'

const userProfileRouter = express.Router()

// Get user profile data
userProfileRouter.get('/profile', authUser, getUserProfile)

// Update user information
userProfileRouter.put('/update-info', authUser, updateUserInfo)

// Save delivery information
userProfileRouter.put('/delivery-info', authUser, saveDeliveryInfo)

// Change password
userProfileRouter.put('/change-password', authUser, changePassword)

// Get user statistics
userProfileRouter.get('/stats', authUser, getUserStats)

export default userProfileRouter
