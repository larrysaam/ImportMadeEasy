import express from 'express'
import adminAuth from '../middleware/adminAuth.js';
import Product from '../models/productModel.js';
import Order from '../models/orderModel.js';
import User from '../models/userModel.js';
import PreOrder from '../models/preorderModel.js';

const DashboardRouter = express.Router();


// Example backend endpoint structure
DashboardRouter.get('/dashboard', adminAuth, async (req, res) => {
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

      // Get recent orders
    const recentOrders = await Order.find()
      .limit(5)
      .sort({ createdAt: -1 })


    res.json({
      success: true,
      stats: {
        totalProducts,
        totalOrders,
        totalPreorders,
        totalUsers,
        totalRevenue,
        revenueData: combinedRevenueData,
        recentOrders
      }
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})


export default DashboardRouter;