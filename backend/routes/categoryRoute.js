import express from 'express';
import adminAuth  from '../middleware/adminAuth.js';
import {
  addMainCategory,
  addSubcategory,
  addSecondLevelSubcategory,
  deleteCategory,
  getCategories,
  getUserCategories
} from '../controllers/categoryController.js';

const router = express.Router();

router.get('/', getCategories);
router.post('/addMain', adminAuth, addMainCategory);
router.post('/addSub', adminAuth, addSubcategory);
router.post('/addSubSub', adminAuth, addSecondLevelSubcategory);
router.delete('/delete', adminAuth, deleteCategory);
router.get('/user', getUserCategories);

export default router;
