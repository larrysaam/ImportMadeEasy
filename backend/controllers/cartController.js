import userModel from '../models/userModel.js'
import productModel from '../models/productModel.js'

//add products to user cart
const addToCart = async (req,res) => {
    try {
        const { userId, itemId, size, color } = req.body;
        
        console.log('Parsed data:', { userId, itemId, size, color });
        
        // Validate required fields
        if (!userId || !itemId || !size) {
            console.error('Missing required fields:', { userId: !!userId, itemId: !!itemId, size: !!size });
            return res.json({success: false, message: 'Missing required fields: userId, itemId, size'});
        }
        
        // Validate that the product exists and has the requested color/size combination
        const product = await productModel.findById(itemId);
        if (!product) {
            return res.json({success: false, message: 'Product not found'});
        }

        // Check if color and size combination is valid and has stock
        if (color) {
            const colorData = product.colors.find(c => c.colorHex === color);
            if (!colorData) {
                return res.json({success: false, message: 'Color not found'});
            }
            
            const sizeData = colorData.sizes.find(s => s.size === size);
            if (!sizeData) {
                return res.json({success: false, message: 'Size not available for this color'});
            }
            
            if (sizeData.quantity <= 0) {
                return res.json({success: false, message: 'Out of stock'});
            }
        }

        // Find user and validate
        const userData = await userModel.findById(userId);
        if (!userData) {
            return res.json({success: false, message: 'User not found'});
        }
        
        console.log('User found:', userData.name);

        // Get current cart data or initialize empty object
        let cartData = userData.cartData || {};
        
        // Create cart key combining size and color
        const cartKey = color ? `${size}-${color}` : size;
        
        console.log('Cart key:', cartKey);
        console.log('Current cart data before update:', cartData);
        
        // Update cart data
        if (cartData[itemId]) {
            if (cartData[itemId][cartKey]) {
                cartData[itemId][cartKey] += 1;
            } else {
                cartData[itemId][cartKey] = 1;
            }
        } else {
            cartData[itemId] = {};
            cartData[itemId][cartKey] = 1;
        }

        console.log('Updated cart data:', cartData);

        // Save updated cart data with proper options
        const updatedUser = await userModel.findByIdAndUpdate(
            userId, 
            { $set: { cartData: cartData } }, 
            { 
                new: true, 
                runValidators: false,
                strict: false, // Allow updating cartData object
                upsert: false
            }
        );

        if (!updatedUser) {
            console.error('Failed to update user cart in database');
            return res.json({success: false, message: 'Failed to update cart'});
        }

        console.log('Cart updated successfully for user:', updatedUser.name);
        console.log('Final cart data in database:', updatedUser.cartData);
        res.json({success: true, message: 'Added to Cart'});

    } catch (error) {
        console.error('Add to cart error:', error);
        res.json({success: false, message: error.message});
    }
}

//update user cart
const updateCart = async (req,res) => {
    try {
        const { userId, itemId, size, quantity, color } = req.body;

        console.log('Update cart request:', { userId, itemId, size, quantity, color });

        // Validate required fields
        if (!userId || !itemId || !size || quantity === undefined) {
            return res.json({success: false, message: 'Missing required fields: userId, itemId, size, quantity'});
        }

        // Find user and validate
        const userData = await userModel.findById(userId);
        if (!userData) {
            return res.json({success: false, message: 'User not found'});
        }

        // Get current cart data or initialize empty object
        let cartData = userData.cartData || {};

        // Create cart key combining size and color
        const cartKey = color ? `${size}-${color}` : size;

        console.log('Cart key for update:', cartKey);
        console.log('Current cart data before update:', cartData);

        if (quantity === 0) {
            // Remove item from cart
            if (cartData[itemId]) {
                delete cartData[itemId][cartKey];
                // If no more sizes/colors for this product, remove the product entirely
                if (Object.keys(cartData[itemId]).length === 0) {
                    delete cartData[itemId];
                }
            }
        } else {
            // Validate stock if quantity > 0
            const product = await productModel.findById(itemId);
            if (!product) {
                return res.json({success: false, message: 'Product not found'});
            }

            // Check stock availability for color/size combination
            if (color) {
                const colorData = product.colors.find(c => c.colorHex === color);
                if (!colorData) {
                    return res.json({success: false, message: 'Color not found'});
                }
                
                const sizeData = colorData.sizes.find(s => s.size === size);
                if (!sizeData) {
                    return res.json({success: false, message: 'Size not available for this color'});
                }
                
                if (quantity > sizeData.quantity) {
                    return res.json({
                        success: false, 
                        message: `Only ${sizeData.quantity} items available in stock`
                    });
                }
            }
            
            // Update quantity
            if (!cartData[itemId]) {
                cartData[itemId] = {};
            }
            cartData[itemId][cartKey] = quantity;
        }

        // Update user cart in database
        const updatedUser = await userModel.findByIdAndUpdate(
            userId, 
            { $set: { cartData } }, 
            { 
                new: true, 
                runValidators: false,
                strict: false
            }
        );

        if (!updatedUser) {
            console.error('Failed to update user cart in database');
            return res.json({success: false, message: 'Failed to update cart'});
        }

        console.log('Updated cart data:', updatedUser.cartData);
        res.json({
            success: true, 
            message: quantity === 0 ? 'Item removed from cart' : 'Cart updated',
            cartData: updatedUser.cartData
        });
    } catch (error) {
        console.error('Update cart error:', error);
        res.json({success: false, message: error.message});
    }
}

//get user cart data
const getUserCart = async (req,res) => {
    try {
        // Get userId from either body (POST) or from auth middleware
        const userId = req.body.userId;

        console.log('Get cart request for user:', userId);

        // Validate required fields
        if (!userId) {
            return res.json({success: false, message: 'Missing required field: userId'});
        }

        // Find user and validate
        const userData = await userModel.findById(userId);
        if (!userData) {
            return res.json({success: false, message: 'User not found'});
        }

        // Get cart data or return empty object
        let cartData = userData.cartData || {};

        console.log('Retrieved cart data for user:', userData.name, cartData);

        res.json({ success: true, cartData });

    } catch (error) {
        console.error('Get cart error:', error);
        res.json({success: false, message: error.message});
    }
}

// Test function to debug cart issues
const testCart = async (req, res) => {
    try {
        const { userId } = req.body;
        
        console.log('Test cart function called for user:', userId);
        
        if (!userId) {
            return res.json({success: false, message: 'Missing userId'});
        }
        
        // Find user
        const user = await userModel.findById(userId);
        if (!user) {
            return res.json({success: false, message: 'User not found'});
        }
        
        console.log('User found:', user.name);
        console.log('Current cart data:', user.cartData);
        
        // Test updating cart data
        const testCartData = {
            'testProduct123': {
                'M-Red': 1,
                'L-Blue': 2
            }
        };
        
        const updatedUser = await userModel.findByIdAndUpdate(
            userId,
            { $set: { cartData: testCartData } },
            { new: true, strict: false }
        );
        
        console.log('Test cart update result:', updatedUser.cartData);
        
        res.json({
            success: true,
            message: 'Test completed',
            originalCart: user.cartData,
            updatedCart: updatedUser.cartData
        });
        
    } catch (error) {
        console.error('Test cart error:', error);
        res.json({success: false, message: error.message});
    }
};

// Clear user cart (useful for after order completion)
const clearCart = async (req, res) => {
    try {
        const { userId } = req.body;
        
        console.log('Clear cart request for user:', userId);
        
        if (!userId) {
            return res.json({success: false, message: 'Missing required field: userId'});
        }

        // Find user and validate
        const userData = await userModel.findById(userId);
        if (!userData) {
            return res.json({success: false, message: 'User not found'});
        }

        // Clear cart data
        const updatedUser = await userModel.findByIdAndUpdate(
            userId, 
            { $set: { cartData: {} } }, 
            { 
                new: true, 
                runValidators: false,
                strict: false
            }
        );

        if (!updatedUser) {
            console.error('Failed to clear user cart in database');
            return res.json({success: false, message: 'Failed to clear cart'});
        }

        console.log('Cart cleared successfully for user:', updatedUser.name);
        res.json({success: true, message: 'Cart cleared successfully'});

    } catch (error) {
        console.error('Clear cart error:', error);
        res.json({success: false, message: error.message});
    }
};

export { addToCart, updateCart, getUserCart, testCart, clearCart }
