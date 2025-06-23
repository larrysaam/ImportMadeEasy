import React, { useContext, useEffect, useState } from 'react'
import { ShopContext } from '@/context/ShopContext'
import Title from '@/components/Title'
import { assets } from '@/assets/assets'
import CartTotal from '@/features/shared/CartTotal'
import { Link } from 'react-router-dom'
import NumberFlow from '@number-flow/react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const Cart = () => {

  const { products, cartItems, token, updateQuantity, navigate } = useContext(ShopContext)
  const [ cartData, setCartData ] = useState([])
  const [inventoryErrors, setInventoryErrors] = useState({})
  const [hasStockError, setHasStockError] = useState(false)
  
  useEffect(() => {

    if (products.length > 0) {
      const tempData = [];

      for (const items in cartItems) {
        for (const cartKey in cartItems[items]) {
          if (cartItems[items][cartKey] > 0) {
            // Parse the cartKey to extract size and color (color is hex code)
            const [size, colorHex] = cartKey.includes('-') ? cartKey.split('-') : [cartKey, undefined];
            
            // Find the product and add safety checks
            const product = products.find(p => p?._id === items);
            
            // Only proceed if product exists
            if (product) {
              const colorData = colorHex && product.colors ? 
                product.colors.find(c => c?.colorHex === colorHex) : null;
              
              tempData.push({
                id: items,
                cartKey: cartKey,
                size: size,
                color: colorData?.colorName || undefined, // Store color name for display
                colorHex: colorHex, // Store hex code for matching
                quantity: cartItems[items][cartKey]
              });
            }
          }
        }
      }
      setCartData(tempData);
    }

  }, [cartItems, products])

  // Add safety checks to the validateInventory function
  const validateInventory = (productId, size, colorHex, quantity) => {
    const product = products.find(p => p?._id === productId);
    if (!product) return; // Exit early if product not found
    
    let sizeData = null;
    
    if (colorHex && product.colors) {
      // Find the color first by hex code, then the size within that color
      const colorData = product.colors.find(c => c?.colorHex === colorHex);
      sizeData = colorData?.sizes?.find(s => s?.size === size);
    } else if (product.sizes) {
      // Fallback to product-level sizes if no color specified
      sizeData = product.sizes.find(s => s?.size === size);
    }
    
    const errorKey = `${productId}-${size}-${colorHex || 'default'}`;
    
    if (sizeData && quantity > sizeData.quantity) {
      setInventoryErrors(prev => ({
        ...prev,
        [errorKey]: `Only ${sizeData.quantity} items available`
      }));
      setHasStockError(true);
    } else {
      setInventoryErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        setHasStockError(Object.keys(newErrors).length > 0);
        return newErrors;
      });
    }
  };

  useEffect(() => {
    // Validate all items in cart
    if (products.length > 0 && cartData.length > 0) {
      cartData.forEach(item => {
        validateInventory(item.id, item.size, item.colorHex, item.quantity)
      })
    }
  }, [cartData, products])

  if (cartData.length == 0) {
    return ( 
      <div className='px-4 sm:px-14 min-h-[50vh] flex flex-col items-center'>
        <div className='text-2xl mb-3 self-start'>
          <Title text1='YOUR' text2='CART'/>
        </div>
        <div className='my-auto text-lg flex flex-col items-center'>
          <p>Your cart is empty! Try to add some items first.</p>
          <Link to='/collection' 
            className='bg-black text-white mt-4 px-4 py-2 w-fit transistion-all duration-500 hover:bg-slate-700'>
            Go shopping!
          </Link>
        </div>
      </div>
    )
  }

  // Update the handleSizeChange function
  const handleSizeChange = (item, newSize) => {
    const product = products.find(p => p._id === item.id)
    let sizeData = null;
    
    // Check stock based on whether item has color or not
    if (item.colorHex && product?.colors) {
      const colorData = product.colors.find(c => c.colorHex === item.colorHex)
      sizeData = colorData?.sizes?.find(s => s.size === newSize)
    } else if (product?.sizes) {
      sizeData = product.sizes.find(s => s.size === newSize)
    }
    
    if (sizeData && item.quantity <= sizeData.quantity) {
      const newCartItems = { ...cartItems }
      const newCartKey = item.colorHex ? `${newSize}-${item.colorHex}` : newSize;
      
      // Set old cart key quantity to 0 and new cart key quantity to item quantity
      newCartItems[item.id] = {
        ...newCartItems[item.id],
        [item.cartKey]: 0,
        [newCartKey]: item.quantity
      }
      
      // Update cart context with single update
      updateQuantity(item.id, newCartKey, item.quantity, newCartItems)
      
      // Validate inventory for new size
      validateInventory(item.id, newSize, item.colorHex, item.quantity)
    } else {
      // If not enough stock in new size, show error
      const errorKey = `${item.id}-${newSize}-${item.colorHex || 'default'}`;
      setInventoryErrors(prev => ({
        ...prev,
        [errorKey]: `Only ${sizeData?.quantity || 0} items available`
      }))
    }
  }

  // Add handleColorChange function
  const handleColorChange = (item, newColorName) => {
    const product = products.find(p => p._id === item.id)
    const newColorData = product?.colors?.find(c => c.colorName === newColorName)
    const sizeData = newColorData?.sizes?.find(s => s.size === item.size)
    
    if (sizeData && item.quantity <= sizeData.quantity) {
      const newCartItems = { ...cartItems }
      const newCartKey = `${item.size}-${newColorData.colorHex}`;
      
      // Set old cart key quantity to 0 and new cart key quantity to item quantity
      newCartItems[item.id] = {
        ...newCartItems[item.id],
        [item.cartKey]: 0,
        [newCartKey]: item.quantity
      }
      
      // Update cart context with single update
      updateQuantity(item.id, newCartKey, item.quantity, newCartItems)
      
      // Validate inventory for new color
      validateInventory(item.id, item.size, newColorData.colorHex, item.quantity)
    } else {
      // If not enough stock in new color, show error
      const errorKey = `${item.id}-${item.size}-${newColorData?.colorHex || 'default'}`;
      setInventoryErrors(prev => ({
        ...prev,
        [errorKey]: `Only ${sizeData?.quantity || 0} items available`
      }))
    }
  }

  // Completely rewrite the getRelatedProducts function to avoid any undefined access
  const getRelatedProducts = () => {
    // Return empty array if no cart data or products
    if (!cartData.length || !products.length) return [];
    
    try {
      // Get categories of items in cart safely
      const cartCategories = new Set();
      
      // Safely collect categories
      cartData.forEach(item => {
        if (!item || !item.id) return;
        
        const product = products.find(p => p && p._id === item.id);
        if (product && product.category) {
          cartCategories.add(product.category);
        }
      });
      
      // If no categories found, return empty array
      if (cartCategories.size === 0) return [];
      
      // Find related products from same categories
      const related = [];
      
      // Safely filter products
      products.forEach(product => {
        // Skip if product is invalid or already in cart
        if (!product || !product._id || !product.category) return;
        if (cartData.some(item => item.id === product._id)) return;
        
        // Add if category matches
        if (cartCategories.has(product.category)) {
          related.push(product);
        }
      });
      
      // Shuffle and return up to 4 products
      return related
        .sort(() => 0.5 - Math.random())
        .slice(0, 4);
        
    } catch (error) {
      console.error("Error in getRelatedProducts:", error);
      return []; // Return empty array on error
    }
  };

  return (
    <div className='px-4 sm:px-14 border-t pt-14 animate-fade animate-duration-500'>
      <div className='text-2xl mb-3'>
        <Title text1='YOUR' text2='CART'/>
      </div>

      <div>
        {
          cartData.map((item, index) => {
            try {
              const productData = products.find((product) => product && product._id === item.id);
              
              // Skip rendering if product not found
              if (!productData) return null;
              
              return (
                <div 
                  key={index} 
                  className='relative py-4 border-t last:border-y text-gray-700 
                    grid grid-cols-1 sm:grid-cols-[3fr_1fr_0.5fr_0.5fr] 
                    items-start sm:items-center gap-4'
                >
                  {/* Product info section */}
                  <div className='flex items-start gap-4 sm:gap-6'>
                    {/* Make image clickable */}
                    <div 
                      onClick={() => navigate(`/product/${item.id}`)}
                      className="cursor-pointer hover:opacity-80 transition-opacity relative"
                    >
                      <img 
                        className='w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-md' 
                        src={(() => {
                          try {
                            // Show color-specific image if available
                            if (item.colorHex && productData.colors) {
                              const colorData = productData.colors.find(c => c && c.colorHex === item.colorHex);
                              if (colorData && colorData.colorImages && colorData.colorImages.length > 0) {
                                return colorData.colorImages[0];
                              }
                            }
                          } catch (error) {
                            console.error("Error rendering color image:", error);
                          }
                          // Fallback to main product image
                          return productData.image && productData.image.length > 0 ? productData.image[0] : '';
                        })()} 
                        alt={`${productData.name} - ${item.color || 'default'}`}
                      />
                      {/* Color indicator badge on image */}
                      {item.color && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full border-2 border-white shadow-md"
                          style={{ 
                            backgroundColor: item.colorHex || '#ccc'
                          }}
                          title={`Color: ${item.color}`}
                        ></div>
                      )}
                    </div>
                    <div className='flex flex-col gap-2 flex-1'>
                      {/* Make product name clickable */}
                      <p 
                        onClick={() => navigate(`/product/${item.id}`)}
                        className='text-sm sm:text-lg font-medium cursor-pointer hover:text-blue-600 transition-colors'
                      >
                        {productData.name}
                      </p>
                      {/* Show color if available with color indicator */}
                      {item.color && (
                        <div className='flex items-center gap-2 text-xs sm:text-sm text-gray-600'>
                          <span>Color:</span>
                          <div className="flex items-center gap-1">
                            <div 
                              className="w-4 h-4 rounded-full border border-gray-300 shadow-sm"
                              style={{ 
                                backgroundColor: item.colorHex || '#ccc'
                              }}
                            ></div>
                            <span className="font-medium">{item.color}</span>
                          </div>
                        </div>
                      )}
                      {/* Mobile price - only shows on mobile */}
                      <p className='block sm:hidden text-sm font-medium text-brand'>
                        <NumberFlow
                          value={productData.price * item.quantity} 
                          format={{ 
                            style: 'currency', 
                            currency: import.meta.env.VITE_CURRENCY || 'EUR', 
                            maximumFractionDigits: 2 
                          }} 
                        />
                      </p>
                      <div className='flex items-center gap-2 flex-wrap'>
                        {/* Color Selection */}
                        {productData.colors && productData.colors.length > 0 && (
                          <Select
                            value={item.color || ''}
                            onValueChange={(newColor) => handleColorChange(item, newColor)}
                          >
                            <SelectTrigger className="w-[120px]">
                              <SelectValue placeholder="Color">
                                {item.color && (
                                  <div className="flex items-center gap-2">
                                    <div 
                                      className="w-4 h-4 rounded-full border border-gray-300 shadow-sm flex-shrink-0"
                                      style={{ 
                                        backgroundColor: item.colorHex || '#ccc'
                                      }}
                                    ></div>
                                    <span className="truncate text-sm">{item.color}</span>
                                  </div>
                                )}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {productData.colors.map((colorOption) => (
                                <SelectItem 
                                  key={colorOption.colorName} 
                                  value={colorOption.colorName}
                                >
                                  <div className="flex items-center gap-2 w-full">
                                    <div 
                                      className="w-4 h-4 rounded-full border border-gray-300 shadow-sm flex-shrink-0"
                                      style={{ backgroundColor: colorOption.colorHex }}
                                    ></div>
                                    <span className="text-sm">{colorOption.colorName}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        
                        {/* Size Selection - Only show for products with real sizes */}
                        {item.size !== 'N/A' && (
                          <Select
                            value={item.size}
                            onValueChange={(newSize) => handleSizeChange(item, newSize)}
                          >
                            <SelectTrigger className="w-[80px]">
                              <SelectValue placeholder="Size">
                                {item.size}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {(() => {
                                // Get available sizes based on selected color, filtering out 'N/A'
                                let availableSizes = [];
                                if (item.colorHex && productData.colors) {
                                  const colorData = productData.colors.find(c => c.colorHex === item.colorHex);
                                  availableSizes = (colorData?.sizes || []).filter(s => s.size !== 'N/A');
                                } else if (productData.sizes) {
                                  availableSizes = productData.sizes.filter(s => s.size !== 'N/A');
                                }

                                return availableSizes.map((sizeOption) => (
                                  <SelectItem
                                    key={sizeOption.size}
                                    value={sizeOption.size}
                                    disabled={sizeOption.quantity === 0}
                                  >
                                    {sizeOption.size}
                                  </SelectItem>
                                ));
                              })()}
                            </SelectContent>
                          </Select>
                        )}
                        
                        {/* Universal quantity input - works on both mobile and desktop */}
                        <div className="flex items-center gap-2">
                          <input 
                            type='number' 
                            min={1} 
                            value={item.quantity} 
                            onChange={(e)=> {
                              const newValue = Number(e.target.value)
                              if (e.target.value === '' || e.target.value === '0') {
                                return null
                              }
                              updateQuantity(item.id, item.cartKey, newValue)
                              validateInventory(item.id, item.size, item.colorHex, newValue)
                            }}
                            className='border w-16 sm:w-20 p-1 sm:px-2 rounded-md'
                          />
                        </div>
                        {/* Mobile delete button */}
                        <button 
                          onClick={() => {
                            // Ensure we're passing the correct cartKey for deletion
                            updateQuantity(item.id, item.cartKey, 0);
                          }}
                          className='block sm:hidden p-2 text-gray-500 hover:text-red-500'
                        >
                          <img 
                            src={assets.deleteIcon} 
                            alt='Remove item' 
                            className='w-4 h-4'
                          />
                        </button>
                      </div>
                      {inventoryErrors[`${item.id}-${item.size}-${item.colorHex || 'default'}`] && (
                        <span className="text-red-500 text-xs font-bold">
                          {inventoryErrors[`${item.id}-${item.size}-${item.colorHex || 'default'}`]}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Desktop price - hidden on mobile */}
                  <NumberFlow
                    className='hidden sm:block w-fit mx-auto text-brand'
                    value={productData.price * item.quantity} 
                    format={{ 
                      style: 'currency', 
                      currency: import.meta.env.VITE_CURRENCY || 'EUR', 
                      maximumFractionDigits: 2 
                    }} 
                  />

                  {/* Desktop delete button - hidden on mobile */}
                  <button 
                    onClick={() => {
                      // Ensure we're passing the correct cartKey for deletion
                      updateQuantity(item.id, item.cartKey, 0);
                    }}
                    className='hidden sm:block mx-auto'
                  >
                    <img 
                      src={assets.deleteIcon} 
                      alt='Remove item' 
                      className='w-5 cursor-pointer hover:scale-110 transition-all duration-300'
                    />
                  </button>
                </div>
              );
            } catch (error) {
              console.error("Error rendering cart item:", error);
              return null; // Skip rendering this item if there's an error
            }
          })
        }
      </div>


      <div className='flex justify-end my-20'>
        <div className='w-full sm:w-1/3 mt-8 sm:mt-0'>
          <CartTotal />
          
          <div className='mt-4 p-4 bg-gray-50 rounded-md'>
            <h3 className='font-medium mb-2 text-sm'>Delivery Details</h3>
            <div className='flex flex-col gap-2 text-sm'>
              <div className='flex justify-between'>
                <p>Shipping Fee:</p>
                <p className='font-medium'>{import.meta.env.VITE_CURRENCY_SYMBOL || '€'}900</p>
              </div>
              <div className='flex justify-between'>
                <p>Estimated Delivery Time:</p>
                <p className='font-medium'>9 days</p>
              </div>
            </div>
          </div>
          
          <div className='w-full text-end'>
            <button 
              onClick={() => (token ? navigate('/place-order') : navigate('/login', { state: { from: '/cart' } }))} 
              disabled={hasStockError}
              className={`bg-brand text-white text-sm my-8 px-4 py-3 transition-all duration-500 
                ${hasStockError 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:bg-brand-dark'
                }`}
            >
              Proceed to checkout
            </button>
          </div>
        </div>
      </div>

      {/* Related products section - ADDING THIS NEW SECTION */}
      <div className="mt-20 border-t pt-10">
        <div className="mb-8">
          <Title text1="RELATED" text2="PRODUCTS" />
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {getRelatedProducts().map((product) => (
            product && ( // Add check to ensure product exists
              <div 
                key={product._id}
                onClick={() => navigate(`/product/${product._id}`)}
                className="cursor-pointer group"
              >
                <div className="aspect-square mb-2 overflow-hidden">
                  <img 
                    src={product.image && product.image.length > 0 ? product.image[0] : ''}
                    alt={product.name || 'Product'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <p className="text-sm font-medium transition-colors">
                  {product.name || 'Product'}
                </p>
                <p className="text-sm text-brand font-medium">
                  <NumberFlow
                    value={product.price || 0}
                    format={{ 
                      style: 'currency', 
                      currency: import.meta.env.VITE_CURRENCY || 'EUR', 
                      maximumFractionDigits: 2 
                    }} 
                  />
                </p>
              </div>
            )
          ))}
        </div>
      </div>
    </div>
  )
}

export default Cart
