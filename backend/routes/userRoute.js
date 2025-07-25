import express from 'express'
import { loginUser, registerUser, getFavorites, toggleFavorite } from '../controllers/userController.js'
import authUser from '../middleware/auth.js'

const userRouter = express.Router()

userRouter.post('/register', registerUser);
userRouter.post('/login', loginUser);
userRouter.get('/favorites', authUser, getFavorites);
userRouter.post('/favorites/toggle', authUser, toggleFavorite);

export default userRouter;