import express from 'express';
import upload from '../middleware/multer.js';
import adminAuth from '../middleware/adminAuth.js';
import authUser from '../middleware/auth.js';
import { 
  addProduct, 
  listProducts, 
  removeProduct, 
  singleProduct, 
  updateProduct, 
  updateQuantity,
  addReview, 
  getProductReviews,
  addUserPhoto,
  getProductById,
  getAllProductReviewsAdmin,
  deleteProductReviewAdmin, 
  getUserPhotos
} from '../controllers/productController.js';

const router = express.Router()
// Flexible file upload configuration that accepts any field names
const imageUpload = upload.any(); // This accepts any field names

// Create product route with updated upload handlingd
router.post('/add', adminAuth, imageUpload, addProduct)// Update product route with same upload handlingdl
router.put('/update/:id', adminAuth, imageUpload, updateProduct)
router.post('/remove',adminAuth, removeProduct);
router.post('/single', singleProduct);
router.get('/single/:id', getProductById); // New route to get product by ID
router.get('/list', listProducts);
router.put('/quantity', adminAuth, updateQuantity)
router.put('/update/:id', authUser, updateProduct);

// Review routes (some already exist in reviewRoutes.js, ensure no conflict or consolidate)
// Admin specific review routes
router.get('/reviews/all', adminAuth, getAllProductReviewsAdmin); // For admin to get all reviews
router.delete('/:productId/reviews/:reviewId', adminAuth, deleteProductReviewAdmin); // For admin to delete a review

router.post('/reviews/add', authUser, addReview)
router.get('/product/:productId', getProductReviews)


router.get('/user/photo/:productId', getUserPhotos);
router.post('/user/photo/:productId', addUserPhoto);


export default router;