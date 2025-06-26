import mongoose from 'mongoose'

const affiliateSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true,
    unique: true
  },
  affiliateCode: {
    type: String,
    unique: true,
    uppercase: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'suspended'],
    default: 'pending'
  },
  applicationData: {
    fullName: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    phone: String,
    website: String,
    socialMedia: String,
    experience: String,
    reason: {
      type: String,
      required: true
    },
    trafficSource: {
      type: String,
      required: true,
      enum: ['website', 'instagram', 'youtube', 'tiktok', 'facebook', 'email', 'other']
    }
  },
  commissionRate: {
    type: Number,
    default: 0.05, // 5% default commission
    min: 0,
    max: 1
  },
  stats: {
    totalClicks: {
      type: Number,
      default: 0
    },
    totalSignups: {
      type: Number,
      default: 0
    },
    totalSales: {
      type: Number,
      default: 0
    },
    totalEarnings: {
      type: Number,
      default: 0
    },
    conversionRate: {
      type: Number,
      default: 0
    }
  },
  paymentInfo: {
    method: {
      type: String,
      enum: ['bank_transfer', 'paypal', 'stripe'],
      default: 'bank_transfer'
    },
    details: {
      type: mongoose.Schema.Types.Mixed // Flexible for different payment methods
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  approvedAt: Date,
  rejectedAt: Date,
  rejectionReason: String,
  notes: String, // Admin notes
  lastPayoutDate: Date,
  nextPayoutAmount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
})

// Note: Affiliate code is now generated in the controller for better control

// Update commission rate based on performance
affiliateSchema.methods.updateCommissionRate = function() {
  const monthlySales = this.stats.totalSales // This would need to be calculated for current month
  
  if (monthlySales >= 25) {
    this.commissionRate = 0.10 // 10% for elite
  } else if (monthlySales >= 11) {
    this.commissionRate = 0.075 // 7.5% for professional
  } else {
    this.commissionRate = 0.05 // 5% for starter
  }
}

// Calculate conversion rate
affiliateSchema.methods.calculateConversionRate = function() {
  if (this.stats.totalClicks > 0) {
    this.stats.conversionRate = (this.stats.totalSignups / this.stats.totalClicks) * 100
  } else {
    this.stats.conversionRate = 0
  }
}

// Virtual for affiliate link
affiliateSchema.virtual('affiliateLink').get(function() {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
  return `${frontendUrl}/register?ref=${this.affiliateCode}`
})

// Ensure virtual fields are serialized
affiliateSchema.set('toJSON', { virtuals: true })

const affiliateModel = mongoose.models.affiliate || mongoose.model('affiliate', affiliateSchema)

export default affiliateModel
