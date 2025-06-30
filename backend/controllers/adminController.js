import adminModel from '../models/adminModel.js'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

// Generate JWT token
const generateToken = (adminId, role, permissions) => {
  return jwt.sign(
    { 
      adminId, 
      role, 
      permissions,
      type: 'admin'
    }, 
    process.env.JWT_SECRET, 
    { expiresIn: '7d' }
  )
}

// Admin login
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.json({
        success: false,
        message: 'Email and password are required'
      })
    }

    // Check if admin exists
    const admin = await adminModel.findOne({ email, isActive: true })
    if (!admin) {
      return res.json({
        success: false,
        message: 'Invalid credentials'
      })
    }

    // Check password
    const isPasswordValid = await admin.comparePassword(password)
    if (!isPasswordValid) {
      return res.json({
        success: false,
        message: 'Invalid credentials'
      })
    }

    // Update last login
    admin.lastLogin = new Date()
    await admin.save()

    // Generate token
    const token = generateToken(admin._id, admin.role, admin.permissions)

    res.json({
      success: true,
      message: 'Login successful',
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions
      }
    })

  } catch (error) {
    console.error('Admin login error:', error)
    res.json({
      success: false,
      message: 'Login failed'
    })
  }
}

// Create admin (only super admin can create)
const createAdmin = async (req, res) => {
  try {
    const { username, email, password, role } = req.body

    // Validate required fields
    if (!username || !email || !password || !role) {
      return res.json({
        success: false,
        message: 'All fields are required'
      })
    }

    // Check if admin already exists
    const existingAdmin = await adminModel.findOne({
      $or: [{ email }, { username }]
    })

    if (existingAdmin) {
      return res.json({
        success: false,
        message: 'Admin with this email or username already exists'
      })
    }

    // Create new admin
    const newAdmin = new adminModel({
      username,
      email,
      password,
      role,
      createdBy: req.admin.adminId
    })

    await newAdmin.save()

    res.json({
      success: true,
      message: 'Admin created successfully',
      admin: {
        id: newAdmin._id,
        username: newAdmin.username,
        email: newAdmin.email,
        role: newAdmin.role,
        permissions: newAdmin.permissions
      }
    })

  } catch (error) {
    console.error('Create admin error:', error)
    res.json({
      success: false,
      message: 'Failed to create admin'
    })
  }
}

// Get all admins (only super admin)
const getAllAdmins = async (req, res) => {
  try {
    const admins = await adminModel.find({ isActive: true })
      .select('-password')
      .populate('createdBy', 'username email')
      .sort({ createdAt: -1 })

    res.json({
      success: true,
      admins
    })

  } catch (error) {
    console.error('Get admins error:', error)
    res.json({
      success: false,
      message: 'Failed to get admins'
    })
  }
}

// Update admin (only super admin)
const updateAdmin = async (req, res) => {
  try {
    const { adminId } = req.params
    const { username, email, role, isActive } = req.body

    const admin = await adminModel.findById(adminId)
    if (!admin) {
      return res.json({
        success: false,
        message: 'Admin not found'
      })
    }

    // Update fields
    if (username) admin.username = username
    if (email) admin.email = email
    if (role) admin.role = role
    if (typeof isActive === 'boolean') admin.isActive = isActive

    await admin.save()

    res.json({
      success: true,
      message: 'Admin updated successfully',
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions,
        isActive: admin.isActive
      }
    })

  } catch (error) {
    console.error('Update admin error:', error)
    res.json({
      success: false,
      message: 'Failed to update admin'
    })
  }
}

// Delete admin (only super admin)
const deleteAdmin = async (req, res) => {
  try {
    const { adminId } = req.params

    // Prevent deleting self
    if (adminId === req.admin.adminId) {
      return res.json({
        success: false,
        message: 'Cannot delete your own account'
      })
    }

    const admin = await adminModel.findById(adminId)
    if (!admin) {
      return res.json({
        success: false,
        message: 'Admin not found'
      })
    }

    // Soft delete
    admin.isActive = false
    await admin.save()

    res.json({
      success: true,
      message: 'Admin deleted successfully'
    })

  } catch (error) {
    console.error('Delete admin error:', error)
    res.json({
      success: false,
      message: 'Failed to delete admin'
    })
  }
}

// Get current admin profile
const getAdminProfile = async (req, res) => {
  try {
    const admin = await adminModel.findById(req.admin.adminId).select('-password')
    
    if (!admin) {
      return res.json({
        success: false,
        message: 'Admin not found'
      })
    }

    res.json({
      success: true,
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions,
        lastLogin: admin.lastLogin
      }
    })

  } catch (error) {
    console.error('Get admin profile error:', error)
    res.json({
      success: false,
      message: 'Failed to get admin profile'
    })
  }
}

export {
  adminLogin,
  createAdmin,
  getAllAdmins,
  updateAdmin,
  deleteAdmin,
  getAdminProfile
}
