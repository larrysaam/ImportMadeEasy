import mongoose from 'mongoose';

const subSubcategorySchema = new mongoose.Schema({
  name: String,
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }]
});

const subcategorySchema = new mongoose.Schema({
  name: String,
  subcategories: [subSubcategorySchema]
});

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  subcategories: [subcategorySchema]
});

export default mongoose.model('Category', categorySchema);