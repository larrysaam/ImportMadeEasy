import PreOrder from '../models/preorderModel.js'
import Product from '../models/productModel.js' // Corrected import
import User from '../models/userModel.js'
import { sendOrderNotification } from '../utils/emailService.js'
import { sendEmail } from '../utils/email.js'

// Helper function to extract size and color from combined string (similar to orderController)
const extractSizeAndColor = (sizeColorString) => {
  if (!sizeColorString || typeof sizeColorString !== 'string') {
    return { size: null, color: null };
  }
  if (sizeColorString.includes('-')) {
    const parts = sizeColorString.split('-');
    if (parts.length >= 2) {
      const size = parts[0].trim();
      const color = parts.slice(1).join('-').trim(); // Handle colors with hyphens like "Light-Blue"
      return { size, color };
    }
  }
  // If no hyphen found, treat the entire string as size
  return { size: sizeColorString.trim(), color: null };
};

// Helper function to validate and process preorder items (adapted from orderController)
const validateAndProcessPreorderItems = async (items) => {
  console.log('Validating and processing preorder items:', items);
  const processedItems = [];
  for (const item of items) {
    if (!item._id || !item.quantity) {
      throw new Error(`Invalid preorder item data: missing required fields (id, quantity)`);
    }

    let extractedSize = item.size;
    let extractedColor = item.color;

    // If size contains a hyphen, extract both size and color
    if (item.size && item.size.includes('-')) {
      const extracted = extractSizeAndColor(item.size);
      extractedSize = extracted.size;
      extractedColor = extracted.color;
      console.log(`Extracted from "${item.size}" for preorder: Size="${extractedSize}", Color="${extractedColor}"`);
    }

    if (!extractedSize) {
      throw new Error(`Invalid preorder item data: missing size information for item ID ${item._id}`);
    }

    const product = await Product.findById(item._id);
    if (!product) {
      throw new Error(`Product ${item._id} not found for preorder`);
    }

    let colorData = null;
    if (extractedColor) {
      // Try to find by hex code first, then by color name
      colorData = product.colors?.find(c => c.colorHex === extractedColor || c.colorName === extractedColor);
      if (!colorData) {
        throw new Error(`Color ${extractedColor} not found for product ${product.name} (ID: ${product._id}) in preorder`);
      }
      const sizeData = colorData.sizes?.find(s => s.size === extractedSize);
      if (!sizeData) {
        throw new Error(`Size ${extractedSize} not available for color ${colorData.colorName} in product ${product.name} (ID: ${product._id}) for preorder`);
      }
      // For preorders, stock check (sizeData.quantity) might be handled differently or represent future availability.
      // We won't throw an error based on current stock for preorders here,
      // but this information could be used for planning.
    } else {
      // If no color is provided, but the product has color variants, it's an issue.
      if (product.colors && product.colors.length > 0) {
        throw new Error(`Product ${product.name} (ID: ${product._id}) requires color selection for preorder`);
      }
      // If product has no color variants, size check would be against product.sizes (if that schema exists)
      // This part needs to align with how products without colors are structured.
      // Assuming for now that if no extractedColor, product should not have color variants.
    }

    const processedItem = {
      _id: product._id, // Use product._id to ensure it's the canonical ID
      name: product.name, // Use product.name for consistency
      price: item.price || product.price, // Price for preorder item
      size: extractedSize,
      color: colorData ? colorData.colorName : null, // Store color name
      colorHex: colorData ? colorData.colorHex : null, // Store hex code
      quantity: item.quantity,
      image: item.image || (colorData?.colorImages?.length > 0 ? colorData.colorImages[0] : (product.image && product.image.length > 0 ? product.image[0] : null)),
      description: product.description, // Use product.description
      originalSizeString: item.size // Keep original for reference
    };
    processedItems.push(processedItem);
    console.log(`Processed preorder item: ${processedItem.name} - Color: ${processedItem.color}, Size: ${processedItem.size}, Quantity: ${processedItem.quantity}`);
  }
  return processedItems;
};

export const getAllPreorders = async (req, res) => {
  try {
    const preorders = await PreOrder.find()
      .sort({ createdAt: -1 })
      .lean()

    res.json({
      success: true,
      preorders
    })
  } catch (error) {
    console.error('Get preorders error:', error)
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

export const updatePreorderStatus = async (req, res) => {
  try {
    const { preorderId, status } = req.body

    const preorder = await PreOrder.findByIdAndUpdate(
      preorderId,
      { status },
      { 
        new: true,
        writeConcern: { w: 1, wtimeout: 5000 }
      }
    )

    if (!preorder) {
      return res.status(404).json({
        success: false,
        message: 'Preorder not found'
      })
    }

    res.json({
      success: true,
      message: 'Preorder status updated successfully'
    })
  } catch (error) {
    console.error('Update preorder status error:', error)
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

export const validateDeposit = async (req, res) => {
  try {
    const { preorderId } = req.body

    const preorder = await PreOrder.findByIdAndUpdate(
      preorderId,
      { payment: true },
      { 
        new: true,
        writeConcern: { w: 1, wtimeout: 5000 }
      }
    )

    if (!preorder) {
      return res.status(404).json({
        success: false,
        message: 'Preorder not found'
      })
    }

    res.json({
      success: true,
      message: 'Deposit validated successfully'
    })
  } catch (error) {
    console.error('Validate deposit error:', error)
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

export const createPreorder = async (req, res) => {
  try {
    const { userId, items, address } = req.body
    console.log('Creating preorder with raw items:', items);

    // Validate and process items to include color/size information
    const processedItems = await validateAndProcessPreorderItems(items);
    console.log('Processed items for preorder:', processedItems);

    const preorderData = {
      user: userId,
      items: processedItems, // Use processed items
      address,
      status: 'Pending', // Initial status for preorder
      paymentMethod: 'Preorder', // Payment method for preorders
      payment: false,
      estimatedDeliveryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      createdAt: Date.now()
    }
    console.log('Preorder data to be saved:', preorderData);

    const newPreorder = new PreOrder(preorderData)
    await newPreorder.save()

    // Send email notification with isPreorder flag
    await sendOrderNotification(newPreorder, true)

    res.json({
      success: true,
      message: 'Preorder placed successfully',
      preorder: newPreorder
    })
  } catch (error) {
    console.error('Create preorder error:', error)
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

export const deletePreorder = async (req, res) => {
  try {
    const { id } = req.params
    
    const preorder = await PreOrder.findById(id)

    // Check if preorder exists
    if (!preorder) {
      return res.status(404).json({
        success: false,
        message: 'Preorder not found'
      })
    }

    // Check if preorder can be deleted (not 'ready' or 'cancelled')
    if (['ready', 'cancelled'].includes(preorder.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete preorder in current status'
      })
    }

    // Delete the preorder with proper write concern
    await PreOrder.findByIdAndDelete(
      id,
      { writeConcern: { w: 1, wtimeout: 5000 } }
    )

    res.json({
      success: true,
      message: 'Preorder deleted successfully'
    })

  } catch (error) {
    console.error('Delete preorder error:', error)
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}



export const userPreorders = async (req, res) => {

   try {
          const { userId } = req.body
    
          const preorders = await PreOrder.find({ user: userId })

          res.json({success: true, preorders})
  
      } catch (error) {
          console.log(error)
          res.json({success: false, message: error.message})
      }
}


export const sendNotification = async (req, res) => {
  try {
    const { email, status, orderDetails } = req.body

    console.log('Sending notification:', { email, status, orderDetails })

    // Email template based on status
    const subject = status === 'Confirmed' 
      ? 'Your Preorder has been Confirmed!'
      : 'Your Preorder has been Cancelled'

    const message = status === 'Confirmed'
      ? `Dear ${orderDetails.name},\n\n` +
        `Great news! Your preorder #${orderDetails.orderId} has been confirmed.\n\n` +
        `Order Details:\n` +
        orderDetails.items.map(item => `- ${item.name} (${item.size}) x${item.quantity}`).join('\n') +
        `\n\n` +
        `Thank you for shopping with us!`
      : `Dear ${orderDetails.name},\n\n` +
        `We regret to inform you that your preorder #${orderDetails.orderId} has been cancelled.\n\n` +
        `Order Details:\n` +
        orderDetails.items.map(item => `- ${item.name} (${item.size}) x${item.quantity}`).join('\n') +
        `\n\n` +
        `If you have any questions, please contact our support team.\n\n` +
        `We apologize for any inconvenience caused.`

    // Send email (using your email service)
    await sendEmail(email, subject, message)

    res.json({ success: true, message: 'Notification sent successfully' })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to send notification' })
  }
}