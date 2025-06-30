import jwt from 'jsonwebtoken'
import adminModel from '../models/adminModel.js'

const adminAuth = async (req, res, next) => {
    try {
        // Check for token in different header formats
        let token = req.headers.token;

        // If not found, check Authorization header
        if (!token && req.headers.authorization) {
            const authHeader = req.headers.authorization;
            if (authHeader.startsWith('Bearer ')) {
                token = authHeader.substring(7); // Remove 'Bearer ' prefix
            }
        }

        if (!token) {
            return res.json({
                success: false,
                message: "Not authorized. Please login again"
            })
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        // Check if it's the new admin system or legacy system
        if (decoded.type === 'admin') {
            // New role-based admin system
            const admin = await adminModel.findById(decoded.adminId)

            if (!admin || !admin.isActive) {
                return res.json({
                    success: false,
                    message: "Admin account not found or inactive"
                })
            }

            // Add admin info to request
            req.admin = {
                adminId: admin._id,
                username: admin.username,
                email: admin.email,
                role: admin.role,
                permissions: admin.permissions
            }
        } else {
            // Legacy admin system (fallback)
            if (decoded !== process.env.ADMIN_EMAIL + process.env.ADMIN_PASSWORD) {
                return res.json({
                    success: false,
                    message: "Not authorized. Please login again"
                })
            }

            // Set legacy admin info
            req.admin = {
                adminId: 'legacy',
                username: 'Legacy Admin',
                email: process.env.ADMIN_EMAIL,
                role: 'super_admin',
                permissions: {
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
            }
        }

        next()
    } catch (error) {
        return res.json({
            success: false,
            message: "Invalid token. Please login again"
        })
    }
}

// Middleware to check specific permissions
const checkPermission = (permission) => {
    return (req, res, next) => {
        if (!req.admin) {
            return res.json({
                success: false,
                message: "Not authenticated"
            })
        }

        if (req.admin.role === 'super_admin' || req.admin.permissions[permission]) {
            next()
        } else {
            return res.json({
                success: false,
                message: `Access denied. Required permission: ${permission}`
            })
        }
    }
}

// Middleware to check if user is super admin
const requireSuperAdmin = (req, res, next) => {
    if (!req.admin) {
        return res.json({
            success: false,
            message: "Not authenticated"
        })
    }

    if (req.admin.role === 'super_admin') {
        next()
    } else {
        return res.json({
            success: false,
            message: "Access denied. Super admin required"
        })
    }
}

export default adminAuth
export { checkPermission, requireSuperAdmin }