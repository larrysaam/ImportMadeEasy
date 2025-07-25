import mongoose from 'mongoose'

const settingSchema = new mongoose.Schema({
  currency: {
    name: { type: String, default: process.env.CURRENCY || 'XAF'},
    sign: { type: String, default: process.env.CURRENCY_SYMBOL || 'FCFA' }
  },
  email: {
    notifications: { type: String, required: true }
  },
  images: {
    hero: [{ type: String }], // Changed to array
    banner: { type: String }
  },
  text: {
    hero: { type: String, default: 'Welcome to our store!' }, // Default text for hero section
    banner: { type: String, default: 'Welcome to our store!' } // Default text for banner
  },
  herolink: {
    productId: { type: String }, // Default link for banner
    category: { type: String },
    subcategory: { type: String },  
    subsubcategory: { type: String }
  },
  link: {
    productId: { type: String }, // Default link for banner
    category: { type: String },
    subcategory: { type: String },
    subsubcategory: { type: String }
  },
  legal: {
    privacyPolicy: { type: String, default: '' },
    termsAndConditions: { type: String, default: '' }
  }
}, {
  timestamps: true
})

const Setting = mongoose.model('Setting', settingSchema)
export default Setting