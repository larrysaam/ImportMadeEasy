import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const adminSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['super_admin', 'assistant_admin'],
    default: 'assistant_admin'
  },
  permissions: {
    dashboard: { type: Boolean, default: true },
    orders: { type: Boolean, default: true },
    categories: { type: Boolean, default: true },
    products: { type: Boolean, default: true },
    messages: { type: Boolean, default: true },
    users: { type: Boolean, default: false },
    settings: { type: Boolean, default: false },
    affiliates: { type: Boolean, default: false },
    analytics: { type: Boolean, default: false },
    adminManagement: { type: Boolean, default: false }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }
}, {
  timestamps: true
})

// Hash password before saving
adminSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next()
  
  try {
    const salt = await bcrypt.genSalt(12)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error)
  }
})

// Compare password method
adminSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password)
}

// Set permissions based on role
adminSchema.methods.setRolePermissions = function() {
  if (this.role === 'super_admin') {
    this.permissions = {
      dashboard: true,
      orders: true,
      categories: true,
      products: true,
      messages: true,
      users: true,
      settings: true,
      affiliates: true,
      analytics: true,
      adminManagement: true
    }
  } else if (this.role === 'assistant_admin') {
    this.permissions = {
      dashboard: true,
      orders: true,
      categories: true,
      products: true,
      messages: true,
      users: false,
      settings: false,
      affiliates: false,
      analytics: false,
      adminManagement: false
    }
  }
}

// Set permissions before saving
adminSchema.pre('save', function(next) {
  this.setRolePermissions()
  next()
})

const adminModel = mongoose.models.Admin || mongoose.model('Admin', adminSchema)

export default adminModel
