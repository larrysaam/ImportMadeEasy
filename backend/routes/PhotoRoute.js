import express from 'express'
import upload from '../middleware/multer.js';
import authUser from '../middleware/auth.js';
import { addUserPhoto, getUserPhotos } from '../controllers/productController.js';

const router = express.Router();

// Photo routes
router.post('/user/:productId', authUser, upload.single('photo'), addUserPhoto);
router.get('/user/:productId', authUser, getUserPhotos);

export default router;