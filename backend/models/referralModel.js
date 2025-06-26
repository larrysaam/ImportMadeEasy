import mongoose from 'mongoose'

const referralSchema = new mongoose.Schema({
  affiliateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'affiliate',
    required: true
  },
  affiliateCode: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['click', 'signup', 'purchase'],
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'order'
  },
  metadata: {
    ip: String,
    userAgent: String,
    referrer: String,
    country: String,
    device: String
  },
  amount: {
    type: Number,
    default: 0 // Order amount for purchases
  },
  commission: {
    type: Number,
    default: 0 // Commission earned
  },
  commissionRate: {
    type: Number,
    default: 0 // Rate at time of transaction
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'paid', 'cancelled'],
    default: 'pending'
  },
  paidAt: Date,
  cancelledAt: Date,
  notes: String
}, {
  timestamps: true
})

// Index for efficient queries
referralSchema.index({ affiliateId: 1, type: 1, createdAt: -1 })
referralSchema.index({ affiliateCode: 1, type: 1 })
referralSchema.index({ userId: 1 }, { sparse: true })
referralSchema.index({ orderId: 1 }, { sparse: true })

// Static method to track click
referralSchema.statics.trackClick = async function(affiliateCode, metadata = {}) {
  try {
    const affiliate = await mongoose.model('affiliate').findOne({ 
      affiliateCode: affiliateCode.toUpperCase(),
      status: 'approved',
      isActive: true
    })
    
    if (!affiliate) {
      return null
    }

    const referral = new this({
      affiliateId: affiliate._id,
      affiliateCode: affiliate.affiliateCode,
      type: 'click',
      metadata
    })

    await referral.save()

    // Update affiliate stats
    await mongoose.model('affiliate').findByIdAndUpdate(affiliate._id, {
      $inc: { 'stats.totalClicks': 1 }
    })

    return referral
  } catch (error) {
    console.error('Error tracking click:', error)
    return null
  }
}

// Static method to track signup
referralSchema.statics.trackSignup = async function(affiliateCode, userId, metadata = {}) {
  try {
    const affiliate = await mongoose.model('affiliate').findOne({ 
      affiliateCode: affiliateCode.toUpperCase(),
      status: 'approved',
      isActive: true
    })
    
    if (!affiliate) {
      return null
    }

    const referral = new this({
      affiliateId: affiliate._id,
      affiliateCode: affiliate.affiliateCode,
      type: 'signup',
      userId,
      metadata,
      status: 'confirmed'
    })

    await referral.save()

    // Update affiliate stats
    await mongoose.model('affiliate').findByIdAndUpdate(affiliate._id, {
      $inc: { 'stats.totalSignups': 1 }
    })

    // Recalculate conversion rate
    const updatedAffiliate = await mongoose.model('affiliate').findById(affiliate._id)
    updatedAffiliate.calculateConversionRate()
    await updatedAffiliate.save()

    return referral
  } catch (error) {
    console.error('Error tracking signup:', error)
    return null
  }
}

// Static method to track purchase
referralSchema.statics.trackPurchase = async function(userId, orderId, amount) {
  try {
    // Find if this user was referred by an affiliate
    const signupReferral = await this.findOne({
      userId,
      type: 'signup',
      status: 'confirmed'
    }).populate('affiliateId')

    if (!signupReferral || !signupReferral.affiliateId) {
      return null
    }

    const affiliate = signupReferral.affiliateId
    const commission = amount * affiliate.commissionRate

    const referral = new this({
      affiliateId: affiliate._id,
      affiliateCode: affiliate.affiliateCode,
      type: 'purchase',
      userId,
      orderId,
      amount,
      commission,
      commissionRate: affiliate.commissionRate,
      status: 'confirmed'
    })

    await referral.save()

    // Update affiliate stats
    await mongoose.model('affiliate').findByIdAndUpdate(affiliate._id, {
      $inc: { 
        'stats.totalSales': 1,
        'stats.totalEarnings': commission,
        'nextPayoutAmount': commission
      }
    })

    // Update commission rate based on new performance
    const updatedAffiliate = await mongoose.model('affiliate').findById(affiliate._id)
    updatedAffiliate.updateCommissionRate()
    await updatedAffiliate.save()

    return referral
  } catch (error) {
    console.error('Error tracking purchase:', error)
    return null
  }
}

const referralModel = mongoose.models.referral || mongoose.model('referral', referralSchema)

export default referralModel
