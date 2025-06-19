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
    if (!color.colorName || !color.colorHex || !color.sizes) {
      throw new Error('Each color must have a name, hex value, and sizes');
    }
  });
};

// function for add products
const addProduct = async (req, res) => {
  try {
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
      label
    } = req.body;

    console.log("Received label value:", label, "Type:", typeof label);
    console.log("Full request body:", req.body);

    // Validate required fields
    if (!name || !description || !price || !category || !subcategory || !subsubcategory) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, description, price, category, subcategory, subsubcategory'
      });
    }

    // Validate price
    if (isNaN(price) || price <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Price must be a positive number'
      });
    }

    // Parse colors data from JSON string if needed
    let colorData;
    try {
      colorData = typeof colors === 'string' ? JSON.parse(colors) : colors;
    } catch (parseError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid colors data format'
      });
    }
    
    console.log("colorData: ", colorData);

    // Validate colors data
    validateColorData(colorData);

    // Handle main product images
    const mainImageUrls = [];
    const mainImageFiles = req.files ? req.files.filter(file => file.fieldname === 'image') : [];
    console.log("main image: ", mainImageFiles);

    if (mainImageFiles.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one main product image is required'
      });
    }

    for (const file of mainImageFiles) {
      try {
        const result = await cloudinary.uploader.upload(file.path);
        mainImageUrls.push(result.secure_url);
      } catch (uploadError) {
        console.error('Image upload error:', uploadError);
        return res.status(500).json({
          success: false,
          message: 'Failed to upload product image'
        });
      }
    }

    // Handle color variant images
    const processedColors = await Promise.all(colorData.map(async (color, index) => {
      const colorImages = [];
      const colorImageFiles = req.files ? req.files.filter(file => file.fieldname === `colorImages_${index}`) : [];

      console.log("color image: ", colorImageFiles);
      
      for (const file of colorImageFiles) {
        try {
          const result = await cloudinary.uploader.upload(file.path);
          colorImages.push(result.secure_url);
        } catch (uploadError) {
          console.error('Color image upload error:', uploadError);
          // Continue with other images instead of failing completely
        }
      }

      return {
        ...color,
        colorImages
      };
    }));

    // Normalize label value - convert 'none' to empty string
    const normalizedLabel = (label === 'none' || !label) ? '' : label;

    // Create new product
    const newProduct = new productModel({
      name: name.trim(),
      description: description.trim(),
      price: Number(price),
      image: mainImageUrls,
      category: category.trim(),
      subcategory: subcategory.trim(),
      subsubcategory: subsubcategory.trim(),
      colors: processedColors,
      bestseller: Boolean(bestseller),
      preorder: Boolean(preorder),
      label: normalizedLabel,
      date: new Date()
    });

    console.log("New product: ", newProduct);

    // Save product
    const savedProduct = await newProduct.save();

    res.json({
      success: true,
      message: 'Product added successfully',
      productId: savedProduct._id
    });
  } catch (error) {
    console.error('Add product error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to add product'
    })
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

    console.log('Received updates:', updates)

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

    const product = await productModel.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );

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

    const sizeIndex = product.colors[colorIndex].sizes.findIndex(s => s.size === size)
    if (sizeIndex === -1) {
      return res.status(400).json({
        success: false,
        message: 'Size not found for this color'
      })
    }

    product.colors[colorIndex].sizes[sizeIndex].quantity = quantity
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