import mongoose from "mongoose";
const { Schema } = mongoose;

// Array limit validator function
const arrayLimit = (val) => {
  return val.length <= 4;
};

const userPhotoSchema = new Schema({
  imageUrl: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  uploadDate: { type: Date, default: Date.now }
});

// Define size schema without _id
const sizeSchema = new Schema({
  size: { 
    type: String, 
    required: true 
  },
  quantity: { 
    type: Number, 
    required: true, 
    default: 0 
  }
}, { _id: false });

// Define color variant schema
const colorVariantSchema = new Schema({
  colorName: { 
    type: String, 
    required: true 
  },
  colorHex: { 
    type: String, 
    required: true,
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Please enter a valid hex color'] 
  },
  colorImages: { type: Array, required: true},
  sizes: [sizeSchema]
}, { _id: false });

const productSchema = new Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: Array, required: true }, // Keep main product images
    category: { type: String, required: true },
    subcategory: { type: String, default: '' }, // Make optional with default empty string
    subsubcategory: { type: String, default: '' }, // Make optional with default empty string
    colors: {
      type: [colorVariantSchema],
      required: true,
      validate: [arr => arr.length > 0, 'At least one color variant is required']
    },
    bestseller: { 
      type: Boolean, 
      default: false,
      required: true
    },
    date: {
      type: Date,
      required: true,
      default: Date.now
    },
    preorder: {
      type: Boolean,
      default: false,
      required: true
    },
    label: {
      type: String,
      enum: ['New model', 'Limited Edition', ''],
      default: ''
    },
    hasSizes: {
      type: Boolean,
      default: true
    },
    sizeType: {
      type: String,
      enum: ['clothing', 'shoes'],
      default: 'clothing'
    },
    reviews: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      userName: {
        type: String,
        required: true
      },
      rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
      },
      comment: {
        type: String,
        required: true
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
    averageRating: {
      type: Number,
      default: 0
    },
    totalReviews: {
      type: Number,
      default: 0
    },
    userPhotos: [userPhotoSchema]
});

// Add method to calculate average rating
productSchema.methods.calculateAverageRating = function() {
  if (this.reviews.length === 0) {
    this.averageRating = 0;
    this.totalReviews = 0;
  } else {
    const sum = this.reviews.reduce((acc, review) => acc + review.rating, 0);
    this.averageRating = Math.round((sum / this.reviews.length) * 10) / 10;
    this.totalReviews = this.reviews.length;
  }
}


export default mongoose.model('Product', productSchema)
