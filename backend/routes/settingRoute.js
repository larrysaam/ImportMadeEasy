import express from 'express'
import multer from 'multer'
import { getSettings, updateSettings, updateBannerLink } from '../controllers/settingController.js'
import adminAuth from '../middleware/adminAuth.js'

const router = express.Router()

// Configure multer for temporary storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'temp/') // Temporary storage before uploading to cloudinary
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.originalname.split('.').pop())
  }
})

const upload = multer({ storage: storage })

router.get('/', adminAuth, getSettings)
router.get('/user', getSettings)
router.put('/', 
  adminAuth, 
  upload.fields([
    { name: 'hero', maxCount: 5 },
    { name: 'banner', maxCount: 1 }
  ]),
  updateSettings
)
router.put('/banner-link', adminAuth, updateBannerLink)

export default router