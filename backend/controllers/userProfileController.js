import userModel from '../models/userModel.js'
import orderModel from '../models/orderModel.js'
import productModel from '../models/productModel.js'
import bcrypt from 'bcrypt'

// Get user profile with stats and recent orders
const getUserProfile = async (req, res) => {
  try {
    const userId = req.body.userId

    // Get user basic info with favorites populated
    const user = await userModel.findById(userId).select('-password').populate({
      path: 'favorites',
      model: 'Product'
    })
    if (!user) {
      return res.json({ success: false, message: "User not found" })
    }

    // Get user orders for stats
    const orders = await orderModel.find({ userId }).sort({ date: -1 })

    // Calculate stats
    const totalOrders = orders.length
    const totalSpent = orders.reduce((sum, order) => sum + order.amount, 0)
    const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0
    const lastOrderDate = orders.length > 0 ? orders[0].date : null

    // Get recent orders (last 5)
    const recentOrders = orders.slice(0, 5).map(order => ({
      _id: order._id,
      date: order.date,
      amount: order.amount,
      status: order.status,
      paymentMethod: order.paymentMethod,
      items: order.items
    }))

    // Get delivery info
    const deliveryInfo = user.deliveryInfo || {
      firstName: '',
      lastName: '',
      email: user.email,
      phone: '',
      address: '',
      city: '',
      state: '',
      zipcode: '',
      country: 'Cameroon'
    }

    const stats = {
      totalOrders,
      totalSpent,
      averageOrderValue,
      lastOrderDate
    }

    const userInfo = {
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      dateJoined: user.date
    }

    res.json({
      success: true,
      user: userInfo,
      stats,
      recentOrders,
      deliveryInfo,
      favorites: user.favorites || []
    })

  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

// Update user information
const updateUserInfo = async (req, res) => {
  try {
    const userId = req.body.userId
    const { name, phone } = req.body

    const updateData = {}
    if (name) updateData.name = name
    if (phone) updateData.phone = phone

    await userModel.findByIdAndUpdate(userId, updateData)

    res.json({ success: true, message: "Profile updated successfully" })

  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

// Save delivery information
const saveDeliveryInfo = async (req, res) => {
  try {
    const userId = req.body.userId
    const deliveryInfo = req.body

    // Remove userId from deliveryInfo object
    delete deliveryInfo.userId

    await userModel.findByIdAndUpdate(userId, { deliveryInfo })

    res.json({ success: true, message: "Delivery information saved successfully" })

  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

// Change password
const changePassword = async (req, res) => {
  try {
    const userId = req.body.userId
    const { currentPassword, newPassword } = req.body

    const user = await userModel.findById(userId)
    if (!user) {
      return res.json({ success: false, message: "User not found" })
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password)
    if (!isMatch) {
      return res.json({ success: false, message: "Current password is incorrect" })
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(newPassword, salt)

    // Update password
    await userModel.findByIdAndUpdate(userId, { password: hashedPassword })

    res.json({ success: true, message: "Password changed successfully" })

  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

// Get user statistics
const getUserStats = async (req, res) => {
  try {
    const userId = req.body.userId

    const orders = await orderModel.find({ userId })

    const totalOrders = orders.length
    const totalSpent = orders.reduce((sum, order) => sum + order.amount, 0)
    const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0

    // Calculate monthly stats
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    
    const monthlyOrders = orders.filter(order => {
      const orderDate = new Date(order.date)
      return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear
    })

    const monthlySpent = monthlyOrders.reduce((sum, order) => sum + order.amount, 0)

    const stats = {
      totalOrders,
      totalSpent,
      averageOrderValue,
      monthlyOrders: monthlyOrders.length,
      monthlySpent
    }

    res.json({ success: true, stats })

  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

export { 
  getUserProfile, 
  updateUserInfo, 
  saveDeliveryInfo, 
  changePassword, 
  getUserStats 
}
