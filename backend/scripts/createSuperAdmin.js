import mongoose from 'mongoose'
import adminModel from '../models/adminModel.js'
import 'dotenv/config'

const createSuperAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('Connected to MongoDB')

    // Check if super admin already exists
    const existingSuperAdmin = await adminModel.findOne({ role: 'super_admin' })
    
    if (existingSuperAdmin) {
      console.log('Super admin already exists:', existingSuperAdmin.email)
      process.exit(0)
    }

    // Create super admin
    const superAdmin = new adminModel({
      username: 'superadmin',
      email: process.env.ADMIN_EMAIL || 'admin@importmadeeasy.com',
      password: process.env.ADMIN_PASSWORD || 'admin123456',
      role: 'super_admin'
    })

    await superAdmin.save()
    console.log('Super admin created successfully!')
    console.log('Email:', superAdmin.email)
    console.log('Username:', superAdmin.username)
    console.log('Role:', superAdmin.role)

    process.exit(0)
  } catch (error) {
    console.error('Error creating super admin:', error)
    process.exit(1)
  }
}

createSuperAdmin()
