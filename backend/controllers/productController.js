import { v2 as cloudinary } from 'cloudinary'
import productModel from '../models/productModel.js'
import User from '../models/userModel.js'
import connectCloudinary from '../config/cloudinary.js'

// Initialize cloudinary configuration
connectCloudinary()

// Helper function to validate color data
const validateColorData = (colors) => {
  if (!Array.isArray(colors) || colors.length === 0) {
    throw new Error('At least one color variant is required');
  }

  colors.forEach(color => {
    if (!color.colorName || !color.colorHex) {
      throw new Error('Each color must have a name and hex value');
    }

    // Validate sizes array exists and has proper structure
    if (!Array.isArray(color.sizes)) {
      throw new Error('Each color must have a sizes array');
    }

    // For products without sizes, there should be exactly one 'N/A' size entry
    if (color.sizes.length === 1 && color.sizes[0].size === 'N/A') {
      if (typeof color.sizes[0].quantity !== 'number' || color.sizes[0].quantity < 0) {
        throw new Error('N/A size must have a valid quantity');
      }
    } else if (color.sizes.length > 0) {
      // For products with sizes, validate each size entry
      color.sizes.forEach(size => {
        if (!size.size || typeof size.quantity !== 'number' || size.quantity < 0) {
          throw new Error('Each size must have a valid size name and quantity');
        }
      });
    }
  });
};

// function for add products
const addProduct = async (req, res) => {
  try {
    console.log("Starting product addition process");
    const {
      name,
      description,
      price,
      category,
      subcategory,
      subsubcategory,
      colors,
      bestseller,
      preorder,
      label,
      hasSizes,
      sizeType,
      keywords,
      countryOfOrigin,
      deliveryMethod,
      productType,
      weight
    } = req.body;

    // Convert string boolean values to actual booleans
    const bestsellerBool = bestseller === 'true' || bestseller === true;
    const preorderBool = preorder === 'true' || preorder === true;

    console.log("Received boolean values - bestseller:", bestseller, "preorder:", preorder);
    console.log("Converted to - bestseller:", bestsellerBool, "preorder:", preorderBool);

    // Parse colors data from JSON string if needed
    const colorData = typeof colors === 'string' ? JSON.parse(colors) : colors;

    // Validate colors data
    validateColorData(colorData);

    // Handle main product images
    const mainImageUrls = [];
    const mainImageFiles = req.files.filter(file => file.fieldname === 'image');

    console.log("Main image files: ", mainImageFiles.length);

    for (const file of mainImageFiles) {
      const result = await cloudinary.uploader.upload(file.path);
      mainImageUrls.push(result.secure_url);
    }

    // Handle color variant images
    const processedColors = await Promise.all(colorData.map(async (color, index) => {
      const colorImages = [];
      const colorImageFiles = req.files.filter(file => file.fieldname === `colorImages_${index}`);

      console.log(`Color ${index} image files: `, colorImageFiles.length);
      
      for (const file of colorImageFiles) {
        const result = await cloudinary.uploader.upload(file.path);
        colorImages.push(result.secure_url);
      }

      return {
        ...color,
        colorImages
      };
    }));

    // Process keywords array
    let processedKeywords = [];
    if (keywords) {
      if (typeof keywords === 'string') {
        processedKeywords = keywords.split(',').map(k => k.trim()).filter(k => k.length > 0);
      } else if (Array.isArray(keywords)) {
        processedKeywords = keywords.filter(k => k && k.trim().length > 0);
      }
    }

    // Create new product with explicit boolean values
    const newProduct = new productModel({
      name,
      description,
      price,
      image: mainImageUrls,
      category,
      subcategory,
      subsubcategory,
      colors: processedColors,
      bestseller: bestsellerBool,
      preorder: preorderBool,
      label: (label === 'none' || !label) ? '' : label,
      hasSizes: hasSizes === 'true' || hasSizes === true,
      sizeType: sizeType || 'clothing',
      keywords: processedKeywords,
      countryOfOrigin: countryOfOrigin || 'Nigeria',
      deliveryMethod: deliveryMethod || 'Standard',
      productType: productType || 'Normal',
      weight: parseFloat(weight) || 0.1,
      date: new Date()
    });

    console.log("Saving product to database...");

    // Save product with explicit error handling
    try {
      const savedProduct = await newProduct.save();
      console.log("Product saved successfully:", savedProduct._id);
      console.log("Saved product boolean values - bestseller:", savedProduct.bestseller, "preorder:", savedProduct.preorder);
      
      res.json({
        success: true,
        message: 'Product added successfully',
        productId: savedProduct._id
      });
    } catch (saveError) {
      console.error("Database save error:", saveError);
      res.status(500).json({
        success: false,
        message: saveError.message || 'Failed to save product to database'
      });
    }
  } catch (error) {
    console.error('Add product error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to add product'
    });
  }
}

// function for list products
const listProducts = async (req,res) => {
    try { 
        const products = await productModel.find({}).sort({ date: -1 });
        
        res.json({
            success: true,
            products: products || []
        });
    } catch (error) {
        console.error('List products error:', error);
        res.json({
            success: false,
            message: error.message
        });
    }
}

// function for removing product
const removeProduct = async (req,res) => {
    try {
        const { id } = req.body;
        
        if (!id) {
            return res.json({
                success: false,
                message: "Product ID is required"
            });
        }
        
        const remove = await productModel.findByIdAndDelete(id, {
            writeConcern: { 
                w: 1,
                wtimeout: 5000 
            }
        });
        
        if (!remove) {
            return res.json({
                success: false,
                message: "Could not find a product to delete!"
            });
        }
        
        res.json({
            success: true,
            message: "Product Deleted"
        });

    } catch (error) {
        console.error('Remove product error:', error);
        res.json({
            success: false,
            message: error.message
        });
    }
}

// function for single product info
const singleProduct = async (req,res) => {
    try {
        const { productId } = req.body;
        
        if (!productId) {
            return res.json({
                success: false,
                message: "Product ID is required"
            });
        }
        
        const product = await productModel.findById(productId);
        
        if (!product) {
            return res.json({
                success: false,
                message: "Product not found"
            });
        }

        res.json({
            success: true,
            product
        });
    } catch (error) {
        console.error('Single product error:', error);
        res.json({
            success: false,
            message: error.message
        });
    }
}

// function to get a single product by ID (typically for GET requests)
const getProductById = async (req, res) => {
    try {
        const { id } = req.params; // Get ID from URL parameters

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Product ID is required in the URL path"
            });
        }

        const product = await productModel.findById(id);

        if (!product) {
            return res.status(404).json({ // Use 404 for not found
                success: false,
                message: "Product not found"
            });
        }

        res.json({
            success: true,
            product
        });
    } catch (error) {
        console.error('Get product by ID error:', error);
        res.status(500).json({ // Use 500 for server errors
            success: false,
            message: error.message
        });
    }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    console.log('Received updates:', updates);
    
    // Handle boolean fields correctly
    if (updates.bestseller !== undefined) {
      updates.bestseller = updates.bestseller === 'true' || updates.bestseller === true;
      console.log('Parsed bestseller value:', updates.bestseller);
    }
    
    if (updates.preorder !== undefined) {
      updates.preorder = updates.preorder === 'true' || updates.preorder === true;
      console.log('Parsed preorder value:', updates.preorder);
    }

    if (updates.hasSizes !== undefined) {
      updates.hasSizes = updates.hasSizes === 'true' || updates.hasSizes === true;
      console.log('Parsed hasSizes value:', updates.hasSizes);
    }

    if (updates.colors) {
      let parsedColorsArray;
      if (typeof updates.colors === 'string') {
        try {
          parsedColorsArray = JSON.parse(updates.colors);
        } catch (e) {
          return res.status(400).json({ success: false, message: "Invalid JSON format for colors field." });
        }
      } else {
        parsedColorsArray = updates.colors;
      }

      validateColorData(parsedColorsArray);

      // Ensure updates.colors is the parsed array of objects
      updates.colors = parsedColorsArray;

      // Handle new color images if any
      if (req.files && req.files.length > 0) {
        updates.colors = await Promise.all(updates.colors.map(async (color, index) => {
          const colorImages = [...(color.colorImages || [])];
          const newColorImages = req.files.filter(file => file.fieldname === `colorImages_${index}`);

          for (const file of newColorImages) {
            const result = await cloudinary.uploader.upload(file.path);
            colorImages.push(result.secure_url);
          }

          return {
            ...color,
            colorImages: colorImages.slice(0, 4) // Ensure max 4 images
          };
        }));
      }
    }

    // Handle main image updates if any
    const mainImageFiles = req.files ? req.files.filter(file => file.fieldname === 'image') : [];
    if (mainImageFiles.length > 0) {
      const mainImageUrls = [];
      for (const file of mainImageFiles) {
        const result = await cloudinary.uploader.upload(file.path);
        mainImageUrls.push(result.secure_url);
      }
      updates.image = mainImageUrls;
    }

    // Normalize label value if it exists
    if (updates.label !== undefined) {
      updates.label = (updates.label === 'none' || !updates.label) ? '' : updates.label;
    }

    // Process keywords array if provided
    if (updates.keywords !== undefined) {
      if (typeof updates.keywords === 'string') {
        updates.keywords = updates.keywords.split(',').map(k => k.trim()).filter(k => k.length > 0);
      } else if (Array.isArray(updates.keywords)) {
        updates.keywords = updates.keywords.filter(k => k && k.trim().length > 0);
      }
    }

    // Handle weight field
    if (updates.weight !== undefined) {
      updates.weight = parseFloat(updates.weight) || 0.1;
    }

    // Ensure subcategory and subsubcategory have default values if not provided
    if (!updates.subcategory) updates.subcategory = '';
    if (!updates.subsubcategory) updates.subsubcategory = '';

    const product = await productModel.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );

    console.log('Updated product boolean values - bestseller:', product.bestseller, 'preorder:', product.preorder);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      message: 'Product updated successfully',
      product
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
}

// Add quantity update endpoint
const updateQuantity = async (req, res) => {
  try {
    const { productId, size, quantity, color } = req.body

    const product = await productModel.findById(productId)
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      })
    }

    // Find the color first, then the size within that color
    if (!color) {
      return res.status(400).json({
        success: false,
        message: 'Color is required'
      })
    }

    const colorIndex = product.colors.findIndex(c => c.colorHex === color)
    if (colorIndex === -1) {
      return res.status(400).json({
        success: false,
        message: 'Color not found'
      })
    }

    // Handle both regular sizes and 'N/A' size for products without sizes
    const targetSize = size || 'N/A' // Default to 'N/A' if no size provided
    const sizeIndex = product.colors[colorIndex].sizes.findIndex(s => s.size === targetSize)

    if (sizeIndex === -1) {
      // If 'N/A' size doesn't exist for products without sizes, create it
      if (targetSize === 'N/A') {
        product.colors[colorIndex].sizes.push({
          size: 'N/A',
          quantity: quantity
        })
      } else {
        return res.status(400).json({
          success: false,
          message: 'Size not found for this color'
        })
      }
    } else {
      product.colors[colorIndex].sizes[sizeIndex].quantity = quantity
    }

    await product.save()

    res.json({
      success: true,
      message: 'Quantity updated successfully'
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}


const addReview = async (req, res) => {
  try {
    const { productId, rating, comment } = req.body
    const userId = req.body.userId // Changed from req.user.id to req.user._id

    // Validate inputs
    if (!productId || !rating || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      })
    }

    // Find product first and check if exists
    const product = await productModel.findById(productId)
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      })
    }

    // Get user details
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    // Check if user has already reviewed
    const existingReview = product.reviews?.find(
      review => review.userId.toString() === userId.toString()
    )

    console.log('Existing review:', existingReview)

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this product'
      })
    }

    // Initialize reviews array if it doesn't exist
    if (!product.reviews) {
      product.reviews = []
    }

    // Add review
    product.reviews.push({
      userId,
      userName: `${user.name}`,
      rating: Number(rating),
      comment,
      createdAt: new Date()
    })

    // Ensure calculateAverageRating method exists
    if (typeof product.calculateAverageRating !== 'function') {
      product.averageRating = product.reviews.reduce((acc, review) => acc + review.rating, 0) / product.reviews.length
      product.totalReviews = product.reviews.length
    } else {
      product.calculateAverageRating()
    }

    // Save with proper error handling
    await product.save()

    res.json({
      success: true,
      message: 'Review added successfully',
      averageRating: product.averageRating,
      totalReviews: product.totalReviews
    })

  } catch (error) {
    console.error('Add review error:', error)
    res.status(500).json({
      success: false,
      message: 'Error adding review: ' + (error.message || 'Unknown error')
    })
  }
}

const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params
    const product = await productModel.findById(productId)
      .select('reviews averageRating totalReviews')
      .sort({ 'reviews.createdAt': -1 })

    res.json({
      success: true,
      reviews: product.reviews,
      averageRating: product.averageRating,
      totalReviews: product.totalReviews
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}


const addUserPhoto = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.body.userId; // Get userId from auth middleware
    
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        message: 'No photo uploaded' 
      });
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      resource_type: 'image',
      folder: 'user-photos' // Optional: organize uploads in folders
    });

    const product = await productModel.findById(productId);
    if (!product) {
      return res.status(404).json({ 
        success: false,
        message: 'Product not found' 
      });
    }

    // Initialize userPhotos array if it doesn't exist
    if (!product.userPhotos) {
      product.userPhotos = [];
    }

    // Add new photo
    product.userPhotos.push({
      imageUrl: result.secure_url,
      userId: userId,
      uploadDate: new Date()
    });

    await product.save();

    res.status(200).json({ 
      success: true, 
      message: 'Photo uploaded successfully',
      userPhotos: product.userPhotos,
      uploadedPhoto: result.secure_url 
    });
  } catch (error) {
    console.error('Photo upload error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error adding photo', 
      error: error.message 
    });
  }
};

const getUserPhotos = async (req, res) => {
  try {
    const { productId } = req.params;
    
    const product = await productModel.findById(productId)
      .select('userPhotos')
      .populate('userPhotos.userId', 'name'); // Optional: populate user details

    if (!product) {
      return res.status(404).json({ 
        success: false,
        message: 'Product not found' 
      });
    }

    res.status(200).json({ 
      success: true,
      userPhotos: product.userPhotos || [] 
    });
  } catch (error) {
    console.error('Fetch photos error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching photos', 
      error: error.message 
    });
  }
};

// Get all reviews from all products for admin panel
const getAllProductReviewsAdmin = async (req, res) => {
  try {
    const allReviews = await productModel.aggregate([
      { $unwind: "$reviews" }, // Deconstruct the reviews array
      {
        $project: { // Select and reshape the output
          _id: "$reviews._id", // Use review's _id as the main ID for this entry
          productId: "$_id",    // Keep product's ID
          productName: "$name",
          productImage: { $arrayElemAt: ["$image", 0] }, // Get the first image of the product
          userId: "$reviews.userId",
          userName: "$reviews.userName",
          rating: "$reviews.rating",
          comment: "$reviews.comment",
          createdAt: "$reviews.createdAt"
        }
      },
      { $sort: { "createdAt": -1 } } // Sort by review creation date, newest first
    ]);

    res.json({
      success: true,
      reviews: allReviews
    });
  } catch (error) {
    console.error('Get all product reviews admin error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch all reviews'
    });
  }
};

// Delete a specific review from a product
const deleteProductReviewAdmin = async (req, res) => {
  try {
    const { productId, reviewId } = req.params;

    const product = await productModel.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // Remove the review from the product's reviews array
    product.reviews.pull({ _id: reviewId });
    product.calculateAverageRating(); // Recalculate average rating and total reviews
    await product.save();

    res.json({ success: true, message: "Review deleted successfully" });
  } catch (error) {
    console.error('Delete product review admin error:', error);
    res.status(500).json({ success: false, message: error.message || "Failed to delete review" });
  }
};

export { addProduct, listProducts, removeProduct, singleProduct, getProductById, updateProduct, updateQuantity, addReview, getProductReviews, getAllProductReviewsAdmin, deleteProductReviewAdmin, addUserPhoto, getUserPhotos }
