import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import productModel from "../models/productModel.js";
import Stripe from 'stripe'
import * as paypal from '@paypal/checkout-server-sdk';
import { sendOrderNotification } from '../utils/emailService.js'

//global variables
const currency = process.env.CURRENCY || 'EUR' // Default currency symbol
const deliveryCharge = 10

// PayPal SDK Client Setup
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;

// Use SandboxEnvironment for testing, LiveEnvironment for production
// Access core and orders via paypal.default if the SDK is wrapped in a default export
const paypalSdk = paypal.default || paypal; // Fallback if 'default' doesn't exist
const environment = process.env.NODE_ENV === 'production'
  ? new paypalSdk.core.LiveEnvironment(PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET)
  : new paypalSdk.core.SandboxEnvironment(PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET);
const paypalClient = new paypalSdk.core.PayPalHttpClient(environment);

//Gateway initialize
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

//Placing orders using COD method
const placeOrder = async (req, res) => {
  try {
    const { userId, items, amount, address } = req.body;

    console.log('Placing COD order with items:', items);
    
    // Validate and process items to ensure they have proper color/size/quantity info
    const processedItems = await validateAndProcessOrderItems(items);
    
    // Update product quantities first
    await updateProductQuantities(processedItems);

    const orderData = {
      userId,
      items: processedItems,
      address,
      amount,
      paymentMethod: "COD",
      payment: false,
      date: Date.now()
    };

    console.log('Order data:', orderData);
    console.log("Processed items: ", processedItems);

    const newOrder = new orderModel(orderData);
    await newOrder.save();

    // Send email notification
    await sendOrderNotification(newOrder);

    // Clear the cart
    await userModel.findByIdAndUpdate(
      userId,
      { cartData: {} }
    );

    res.json({
      success: true,
      message: 'Order placed successfully'
    });
  } catch (error) {
    console.error('Place order error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

// Server-side function to create a PayPal order
const createPaypalOrder = async (req, res) => {
  try {
    const { items } // Expect items to calculate amount
      = req.body;

      console.log('Creating PayPal order with items:', items)

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Order items are required to create PayPal order.' });
    }

    // Calculate total amount from items. This logic should mirror your cart total calculation.
    // This is a simplified example; you'll need to fetch product prices securely from your DB.
    let calculatedAmount = 0;
    for (const item of items) {
        const product = await productModel.findById(item._id);
        if (!product) throw new Error(`Product with id ${item._id} not found.`);
        calculatedAmount += product.price * item.quantity;
    }
    calculatedAmount += deliveryCharge; // Add delivery charge

    const request = new paypalSdk.orders.OrdersCreateRequest();
    request.prefer('return=representation');
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: process.env.CURRENCY || 'USD', // Ensure this matches frontend
            value: calculatedAmount.toFixed(2),
          },
          // You can add more details like items list here if needed by PayPal
        },
      ],
    });

    const paypalOrder = await paypalClient.execute(request);
    console.log("Paypal order created : ", paypalOrder.result.purchase_units)
    res.status(201).json({ success: true, orderID: paypalOrder.result.id });

  } catch (error) {
    console.error('Error creating PayPal order:', error);
    res.status(500).json({ success: false, message: 'Could not create PayPal order', error: error.message });
  }
};

// Server-side function to capture a PayPal order and finalize in DB
const capturepaypalorder = async (req, res) => {
  const {userId, items, amount, address } = req.body; // Expect full order details
  const {orderID} = req.params;


  console.log('Capturing PayPal order with items:', items, 'OrderId', orderID)
  if (!orderID || !userId || !items || !amount || !address) {
    return res.status(400).json({ success: false, message: 'Missing required fields for capturing PayPal order (orderID, userId, items, amount, address).' });
  }

  const request = new paypalSdk.orders.OrdersCaptureRequest(orderID);
  request.requestBody({}); // Empty request body for capture

  try {
    const capture = await paypalClient.execute(request);
    console.log('PayPal capture successful:', capture.result);

    if (capture.result.status === 'COMPLETED') {
      // Payment is successful in PayPal. Now, create the order in your database.
      const processedItems = await validateAndProcessOrderItems(items);
      await updateProductQuantities(processedItems);

      const orderData = {
        userId,
        items: processedItems,
        address,
        amount,
        paymentMethod: "PayPal",
        payment: true,
        paymentId: orderID, // PayPal Order ID
        date: Date.now()
      };

      const newOrder = new orderModel(orderData);
      await newOrder.save();
      await sendOrderNotification(newOrder);
      await userModel.findByIdAndUpdate(userId, { cartData: {} });

      console.log('paypal payment successful')
      res.status(200).json({
        success: true,
        message: 'Payment captured and order placed successfully',
        orderDetails: newOrder
      });
    } else {
      // Handle other statuses like PENDING, FAILED, etc.
      res.status(400).json({ success: false, message: `PayPal payment not completed. Status: ${capture.result.status}` });
    }
  } catch (error) {
    console.error('Error capturing PayPal order:', error);
    // Check if error is a PayPalHttpError for more details
    if (error.isAxiosError && error.response && error.response.data) { // Axios error from PayPal
        console.error('PayPal API Error details:', error.response.data);
        return res.status(error.response.status || 500).json({ success: false, message: 'Could not capture PayPal order.', error: error.response.data });
    }
    res.status(500).json({ success: false, message: 'Could not capture PayPal order', error: error.message });
  }
}

//Placing orders using PayPal method (after client-side approval)
const placeOrderPaypal = async (req, res) => {
  try {
    const { userId, items, amount, address, paypalOrderId, payment } = req.body;

    console.log('Placing PayPal order with items:', items);
    console.log('PayPal Order ID:', paypalOrderId);

    // Validate and process items to ensure they have proper color/size/quantity info
    const processedItems = await validateAndProcessOrderItems(items);
    
    // Update product quantities first
    await updateProductQuantities(processedItems);

    const orderData = {
      userId,
      items: processedItems,
      address,
      amount,
      paymentMethod: "PayPal",
      payment: payment === true, // Ensure payment status is correctly set
      paymentId: paypalOrderId, // Store PayPal Order ID
      date: Date.now()
    };

    const newOrder = new orderModel(orderData);
    await newOrder.save();

    // Send email notification
    await sendOrderNotification(newOrder);

    // Clear the cart
    await userModel.findByIdAndUpdate(userId, { cartData: {} });

    res.json({
      success: true,
      message: 'Order placed successfully with PayPal'
    });
  } catch (error) {
    console.error('Place PayPal order error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

//Placing orders using Stripe method
const placeOrderStripe = async  (req,res) => {
    try {
        const { userId, items, amount, address, payment } = req.body;
        const { origin } = req.headers;
        
        console.log('Placing Stripe order with items:', items);
        
        // Validate and process items to ensure they have proper color/size/quantity info
        const processedItems = await validateAndProcessOrderItems(items);
        
        const orderData = {
            userId,
            items: processedItems,
            address,
            amount,
            paymentMethod: "Stripe",
            payment,
            date: Date.now()
        }

        const newOrder = new orderModel(orderData)
        await newOrder.save()

        const line_items = processedItems.map((item)=> ({
            price_data: {
                currency: currency,
                product_data: {
                    name: `${item.name}${item.color ? ` - ${item.color}` : ''} (Size: ${item.size})`,
                    description: `Color: ${item.color || 'N/A'}, Size: ${item.size}, Quantity: ${item.quantity}`
                },
                unit_amount: item.price * 100
            },
            quantity: item.quantity
        }))

        line_items.push({
            price_data: {
                currency: currency,
                product_data: {
                    name: "Delivery fee",
                },
                unit_amount: deliveryCharge * 100
            },
            quantity: 1,      
        })

        const session = await stripe.checkout.sessions.create({
            success_url: `${origin}/verify?success=true&orderId=${newOrder._id}`,
            cancel_url: `${origin}/verify?success=false&orderId=${newOrder._id}`,
            line_items,
            mode: 'payment',
        })

        res.json({
            success: true,
            session_url: session.url
        })
    } catch (error) {
        console.log(error)
        res.json({
            success: false,
            message: error.message
        })
    }
}

//verify Stripe
const verifyStripe = async (req,res) => {
    const { orderId, success, userId } = req.body;
    try {
        if (success === 'true') {
            //update status and clear the cart
            await orderModel.findByIdAndUpdate(orderId,{payment: true})
            await userModel.findByIdAndUpdate(userId,{cartData: {}})
            res.json({
                success: true
            })
        } else {
            await orderModel.findByIdAndDelete(orderId)
            res.json({
                success: false
            })
        }

    } catch (error) {
        console.log(error)
        res.json({
            success: false,
            message: error.message
        })
    }
}

//All orders data for Admin panel
const allOrders = async  (req,res) => {
    try {
        
        const orders = await orderModel.find({})
        res.json({ success:true, orders })
    } catch (error) {
        console.log(error)
        res.json({ success: false ,message: error.message })
    }
}

//User order data for frontend
const userOrders = async  (req,res) => {
    try {
        
        const { userId } = req.body

        const orders = await orderModel.find({userId})
        res.json({success: true, orders})

    } catch (error) {
        console.log(error)
        res.json({success: false, message: error.message})
    }
}

const validatePayment = async (req, res) => {
    try {
        const { orderId } = req.body;
        
        const order = await orderModel.findByIdAndUpdate(
            orderId,
            { payment: true },
            { 
                new: true,
                writeConcern: { w: 'majority' } // Proper write concern configuration
            }
        );

        console.log(order);

        if (!order) {
            return res.json({
                success: false,
                message: "Order not found"
            });
        }

        res.json({
            success: true,
            message: "Payment validated successfully"
        });
    } catch (error) {
        console.log(error);
        res.json({
            success: false,
            message: error.message
        });
    }
};



//Update Order Status from Admin panel
const updateStatus = async  (req,res) => {
    try {
        const { orderId, status } = req.body

        await orderModel.findByIdAndUpdate(orderId, { status })
        res.json({success: true, message: 'Status updated'})
    } catch (error) {
        console.log(error)
        res.json({success: false, message: error.message})  
    }
}

// Create Payment Intent
const createPaymentIntent = async (req, res) => {
  try {
    const { amount, address, orderData } = req.body;

    console.log('Creating payment intent with amount:', amount, 'and order data:', address);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: process.env.CURRENCY || 'EUR',
      metadata: {
        customerEmail: address.email,
      }
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('Payment intent creation error:', error);
    res.status(500).json({
      error: error.message
    });
  }
};

// Handle successful payment and create order
const createOrder = async (req, res) => {
  try {
    const { address, items, amount, paymentIntentId } = req.body;
    const userId = req.user._id;

    console.log('Creating order with items:', items);

    // Verify payment intent status
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      throw new Error('Payment has not been completed');
    }

    // Validate and process items
    const processedItems = await validateAndProcessOrderItems(items);

    // Update product quantities
    await updateProductQuantities(processedItems);

    // Create order
    const order = new orderModel({
      userId,
      items: processedItems,
      address,
      amount,
      paymentMethod: 'stripe',
      paymentId: paymentIntentId,
      payment: true,
      status: 'processing',
      date: new Date()
    });

    await order.save();

    // Clear user's cart
    await userModel.findByIdAndUpdate(
      userId,
      { cartData: {} },
      { new: true }
    );

    // Send email notification
    await sendOrderNotification(order);

    res.json({
      success: true,
      message: 'Order created successfully',
      order
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create order'
    });
  }
};

const createCheckoutSession = async (req, res) => {
  try {
    const { items, address } = req.body;
    const userId = req.body.userId; // Get userId from auth middleware

    console.log('Creating checkout session with items:', items);
    
    // Validate and process items to ensure they have proper color/size/quantity info
    const processedItems = await validateAndProcessOrderItems(items);

    // Create line items for Stripe with proper image handling
    const lineItems = processedItems.map(item => {
      // Ensure image is a valid URL string and wrap it in an array
      const imageUrl = Array.isArray(item.image) ? item.image[0] : item.image;
      
      return {
        price_data: {
          currency: process.env.CURRENCY || 'usd',
          product_data: {
            name: `${item.name}${item.color ? ` - ${item.color}` : ''} (Size: ${item.size})`,
            description: `Color: ${item.color || 'N/A'}, Size: ${item.size}, Quantity: ${item.quantity}`,
            images: imageUrl ? [imageUrl] : [], // Must be an array with valid URLs
          },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      };
    });

    // Add delivery fee
    lineItems.push({
      price_data: {
        currency: process.env.CURRENCY || 'usd',
        product_data: {
          name: 'Delivery Fee',
          description: 'Standard Shipping',
        },
        unit_amount: 1000, // $10.00
      },
      quantity: 1,
    });

    const order = new orderModel({
      userId,
      items: processedItems,
      address,
      amount: processedItems.reduce((acc, item) => acc + (item.price * item.quantity), 0) + 10,
      paymentMethod: 'stripe',
      status: 'pending',
      payment: false,
      date: new Date()
    });

    // Save with proper write concern
    await order.save({ writeConcern: { w: 1 } }); // Use w: 1 for primary acknowledgment

    const session = await stripe.checkout.sessions.create({
      customer_email: address.email,
      line_items: lineItems,
      mode: 'payment',
      success_url: `${req.headers.origin}/order-success?session_id={CHECKOUT_SESSION_ID}&order_id=${order._id}`,
      cancel_url: `${req.headers.origin}/cart`,
      metadata: {
        orderId: order._id.toString(),
        userId: userId.toString()
      },
      shipping_address_collection: {
        allowed_countries: ['US', 'CA', 'GB', 'FR'],
      },
    });

    

    res.json({ 
      success: true,
      sessionId: session.id,
      sessionUrl: session.url 
    });
  } catch (error) {
    console.error('Checkout session error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const verifyCheckoutSession = async (req, res) => {
  try {
    const { sessionId, orderId } = req.query;

    console.log('Verifying session:', sessionId);

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    console.log('Session status:', session.payment_status);

    if (session.payment_status === 'paid') {
      // Get order details first
      const order = await orderModel.findById(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      // Update product quantities
      await updateProductQuantities(order.items);

      // Update order status
      const updatedOrder = await orderModel.findByIdAndUpdate(
        orderId,
        {
          payment: true,
          status: 'processing',
          paymentId: session.payment_intent
        },
        { new: true }
      );

      // Clear cart
      await userModel.findByIdAndUpdate(
        session.metadata.userId,
        { cartData: {} }
      );

      // Send notification
      await sendOrderNotification(updatedOrder);

      res.json({
        success: true,
        order: updatedOrder
      });
    } else if (session.payment_status === 'unpaid') {
      // Payment failed
      await orderModel.findByIdAndUpdate(
        orderId,
        {
          status: 'cancelled',
          payment: false
        }
      );

      res.status(400).json({
        success: false,
        message: 'Payment was not completed'
      });
    } else {
      console.warn('Unexpected payment status:', session.payment_status);
      throw new Error(`Unexpected payment status: ${session.payment_status}`);
    }
  } catch (error) {
    console.error('Session verification error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Helper function to extract size and color from combined string
const extractSizeAndColor = (sizeColorString) => {
  if (!sizeColorString || typeof sizeColorString !== 'string') {
    return { size: null, color: null };
  }
  
  // Check if the string contains a hyphen separator
  if (sizeColorString.includes('-')) {
    const parts = sizeColorString.split('-');
    if (parts.length >= 2) {
      const size = parts[0].trim();
      const color = parts.slice(1).join('-').trim(); // Handle colors with hyphens like "Light-Blue"
      return { size, color };
    }
  }
  
  // If no hyphen found, treat the entire string as size (backward compatibility)
  return { size: sizeColorString.trim(), color: null };
};

// Helper function to validate and process order items
const validateAndProcessOrderItems = async (items) => {
  console.log('Validating and processing order items:', items);
  
  const processedItems = [];
  
  for (const item of items) {
    // Validate required fields
    if (!item._id || !item.quantity) {
      throw new Error(`Invalid item data: missing required fields (id, quantity)`);
    }
    
    // Extract size and color from the size field if it contains both
    let extractedSize = item.size;
    let extractedColor = item.color;
    
    // If size contains a hyphen, extract both size and color
    if (item.size && item.size.includes('-')) {
      const extracted = extractSizeAndColor(item.size);
      extractedSize = extracted.size;
      extractedColor = extracted.color;
      console.log(`Extracted from "${item.size}": Size="${extractedSize}", Color="${extractedColor}"`);
    }
    
    // Validate that we have a size after extraction
    if (!extractedSize) {
      throw new Error(`Invalid item data: missing size information`);
    }
    
    // Get product details
    const product = await productModel.findById(item._id);
    if (!product) {
      throw new Error(`Product ${item._id} not found`);
    }
    
    // Validate color and size combination if color is provided
    console.log("Extracted color: ", extractedColor)
    let colorData = null;
    
    if (extractedColor) {
      // First try to find by hex code (for cart items)
      colorData = product.colors?.find(c => c.colorHex === extractedColor);
      
      // If not found by hex, try to find by color name (for direct orders)
      if (!colorData) {
        colorData = product.colors?.find(c => c.colorName === extractedColor);
      }
      
      if (!colorData) {
        throw new Error(`Color ${extractedColor} not found for product ${product.name}`);
      }
      
      const sizeData = colorData.sizes?.find(s => s.size === extractedSize);
      if (!sizeData) {
        throw new Error(`Size ${extractedSize} not available for color ${colorData.colorName} in product ${product.name}`);
      }
      
      // Check stock availability
      if (sizeData.quantity < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name} - ${colorData.colorName} (Size: ${extractedSize}). Available: ${sizeData.quantity}, Requested: ${item.quantity}`);
      }
    } else {
      // If no color, check if product has color variants and validate accordingly
      if (product.colors && product.colors.length > 0) {
        // For products with colors, we need a color specified
        throw new Error(`Product ${product.name} requires color selection`);
      }
    }
    
    // Create processed item with all necessary information
    const processedItem = {
      _id: item._id,
      name: item.name || product.name,
      price: item.price || product.price,
      size: extractedSize,
      color: colorData ? colorData.colorName : extractedColor, // Store color name for consistency
      colorHex: colorData ? colorData.colorHex : null, // Store hex code for reference
      quantity: item.quantity,
      image: item.image || product.image,
      description: item.description || product.description,
      originalSizeString: item.size // Keep original for reference
    };
    
    processedItems.push(processedItem);
    console.log(`Processed item: ${processedItem.name} - Color: ${processedItem.color}, Size: ${processedItem.size}, Quantity: ${processedItem.quantity}`);
  }
  
  return processedItems;
};

// Add this helper function
const updateProductQuantities = async (items) => {
  console.log('Updating product quantities for items:', items);
  try {
    for (const item of items) {
      const product = await productModel.findById(item._id);
      if (!product) {
        throw new Error(`Product ${item._id} not found`);
      }

      console.log('Product found:', product.name);
      console.log('Item details:', { size: item.size, color: item.color, quantity: item.quantity, originalSizeString: item.originalSizeString });

      // Find the color and size combination
      let sizeObj = null;
      
      if (item.color && product.colors) {
        // Find the color first - try by color name first, then by hex code
        let colorData = product.colors.find(c => c.colorName === item.color);
        
        // If not found by name, try by hex code (for backward compatibility)
        if (!colorData && item.colorHex) {
          colorData = product.colors.find(c => c.colorHex === item.colorHex);
        }
        
        // If still not found, try treating item.color as hex code
        if (!colorData) {
          colorData = product.colors.find(c => c.colorHex === item.color);
        }
        
        if (!colorData) {
          throw new Error(`Color ${item.color} not found for product ${product.name}`);
        }
        
        // Find the size within that color
        sizeObj = colorData.sizes?.find(s => s.size === item.size);
        if (!sizeObj) {
          throw new Error(`Size ${item.size} not found for color ${colorData.colorName} in product ${product.name}`);
        }
      } else {
        // Fallback to product-level sizes (for backward compatibility)
        if (product.sizes) {
          sizeObj = product.sizes.find(s => s.size === item.size);
        }
        
        if (!sizeObj) {
          throw new Error(`Size ${item.size} not found for product ${product.name}`);
        }
      }

      // Check if quantity is available
      if (sizeObj.quantity < item.quantity) {
        throw new Error(`Insufficient quantity for ${product.name} in size ${item.size}${item.color ? ` and color ${item.color}` : ''}. Available: ${sizeObj.quantity}, Requested: ${item.quantity}`);
      }

      // Update the quantity in the size object
      const previousQuantity = sizeObj.quantity;
      sizeObj.quantity -= item.quantity;

      // Save the updated product
      await product.save();
      console.log(`Updated quantity for ${product.name} size ${item.size}${item.color ? ` color ${item.color}` : ''}: ${previousQuantity} -> ${sizeObj.quantity} (reduced by ${item.quantity})`);
    }
  } catch (error) {
    console.error('Error updating quantities:', error);
    throw new Error(`Failed to update product quantities: ${error.message}`);
  }
};

export { placeOrder, createPaypalOrder, capturepaypalorder, placeOrderPaypal, placeOrderStripe, allOrders, userOrders, updateStatus, verifyStripe, validatePayment, createPaymentIntent, createOrder, createCheckoutSession, verifyCheckoutSession }