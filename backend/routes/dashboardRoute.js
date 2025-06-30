import express from 'express'
import adminAuth, { checkPermission } from '../middleware/adminAuth.js';
import Product from '../models/productModel.js';
import Order from '../models/orderModel.js';
import User from '../models/userModel.js';
import PreOrder from '../models/preorderModel.js';

const DashboardRouter = express.Router();


// Example backend endpoint structure
DashboardRouter.get('/dashboard', adminAuth, checkPermission('dashboard'), async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments()
    const totalOrders = await Order.countDocuments()
    const totalPreorders = await PreOrder.countDocuments()
    const totalUsers = await User.countDocuments()

    // Get all paid orders and preorders
    const orders = await Order.find({ payment: true })
    const preorders = await PreOrder.find({ payment: true })
    
    // Calculate total revenue including both orders and preorders
    const orderRevenue = orders.reduce((sum, order) => {
      if (order.paymentMethod === 'stripe') {
        return sum + order.amount
      } else {
        return order.status === 'Delivered' ? sum + order.amount : sum
      }
    }, 0)

    const preorderRevenue = preorders.reduce((sum, preorder) => {
      return sum + preorder.items.reduce((itemSum, item) => itemSum + item.price, 0)
    }, 0)

    const totalRevenue = orderRevenue + preorderRevenue

    // Get monthly revenue data with conditional aggregation
    const orderRevenueData = await Order.aggregate([
      {
        $match: {
          payment: true,
          $or: [
            { paymentMethod: 'stripe' },
            { 
              paymentMethod: { $ne: 'stripe' },
              status: 'Delivered'
            }
          ]
        }
      },
      {
        $addFields: {
          monthYear: {
            $dateToString: {
              format: "%Y-%m",
              date: { $toDate: "$date" }
            }
          }
        }
      },
      {
        $group: {
          _id: "$monthYear",
          revenue: { $sum: "$amount" }
        }
      }
    ])

    const preorderRevenueData = await PreOrder.aggregate([
      {
        $match: { payment: true }
      },
      {
        $addFields: {
          monthYear: {
            $dateToString: {
              format: "%Y-%m",
              date: { $toDate: "$createdAt" }
            }
          }
        }
      },
      {
        $unwind: "$items"
      },
      {
        $group: {
          _id: "$monthYear",
          revenue: { $sum: "$items.price" }
        }
      }
    ])

    // Combine and format revenue data
    const combinedRevenueData = [...orderRevenueData, ...preorderRevenueData].reduce((acc, item) => {
      const existing = acc.find(x => x._id === item._id)
      if (existing) {
        existing.revenue += item.revenue
      } else {
        acc.push(item)
      }
      return acc
    }, [])
    .sort((a, b) => a._id.localeCompare(b._id))
    .map(item => ({
      month: new Date(item._id).toLocaleString('default', { month: 'short', year: 'numeric' }),
      revenue: item.revenue
    }))

    res.json({
      success: true,
      stats: {
        totalProducts,
        totalOrders,
        totalPreorders,
        totalUsers,
        totalRevenue,
        revenueData: combinedRevenueData
      }
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// Get all users for admin management
DashboardRouter.get('/users', adminAuth, checkPermission('users'), async (req, res) => {
  try {
    const users = await User.find({}, {
      name: 1,
      email: 1,
      date: 1,
      _id: 1
    }).sort({ date: -1 })

    res.json({
      success: true,
      users
    })
  } catch (error) {
    console.error('Get users error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// Get user statistics
DashboardRouter.get('/users/:userId/stats', adminAuth, checkPermission('users'), async (req, res) => {
  try {
    const { userId } = req.params

    // Check if user exists
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    // Get user's orders
    const orders = await Order.find({ userId })
    const preorders = await PreOrder.find({ userId })

    // Calculate statistics
    const totalOrders = orders.length
    const totalPreorders = preorders.length

    // Calculate total spent (only from paid orders)
    const totalSpent = orders
      .filter(order => order.payment === true)
      .reduce((sum, order) => sum + order.amount, 0)

    // Get last order date
    const lastOrder = orders
      .filter(order => order.payment === true)
      .sort((a, b) => new Date(b.date) - new Date(a.date))[0]

    const lastOrderDate = lastOrder ? lastOrder.date : null

    res.json({
      success: true,
      stats: {
        totalOrders,
        totalPreorders,
        totalSpent,
        lastOrderDate
      }
    })
  } catch (error) {
    console.error('Get user stats error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// Delete a user account
DashboardRouter.delete('/users/:userId', adminAuth, checkPermission('users'), async (req, res) => {
  try {
    const { userId } = req.params

    // Check if user exists
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    // Delete user's orders
    await Order.deleteMany({ userId })

    // Delete user's preorders
    await PreOrder.deleteMany({ userId })

    // Delete the user account
    await User.findByIdAndDelete(userId)

    res.json({
      success: true,
      message: 'User account and associated data deleted successfully'
    })
  } catch (error) {
    console.error('Delete user error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})


export default DashboardRouter;