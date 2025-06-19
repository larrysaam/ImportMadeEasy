import express from 'express'
import adminAuth from '../middleware/adminAuth.js'
import auth from '../middleware/auth.js'
import { 
  createPreorder,
  getAllPreorders,
  updatePreorderStatus,
  validateDeposit,
  deletePreorder,
  userPreorders,
  sendNotification
} from '../controllers/preorderController.js'

const router = express.Router()

router.post('/create', auth, createPreorder)
router.get('/list', adminAuth, getAllPreorders)
router.get('/user', auth, getAllPreorders)
router.post('/userpreorders', auth, userPreorders)
router.put('/status', adminAuth, updatePreorderStatus)
router.put('/deposit', adminAuth, validateDeposit)
router.post('/notify', adminAuth, sendNotification)
router.delete('/:id', auth, deletePreorder) // Added delete route

export default router
