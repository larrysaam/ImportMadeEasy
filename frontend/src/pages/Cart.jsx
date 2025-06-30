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
  const [shippingMode, setShippingMode] = useState('sea') // 'air', 'sea', 'land'
  const [cartByCountry, setCartByCountry] = useState({ nigeria: [], china: [] })
  const [selectedCountryForCheckout, setSelectedCountryForCheckout] = useState('')
  
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
              
              const cartItem = {
                id: items,
                cartKey: cartKey,
                size: size,
                color: colorData?.colorName || undefined, // Store color name for display
                colorHex: colorHex, // Store hex code for matching
                quantity: cartItems[items][cartKey],
                product: product // Store full product data for country checking
              };

              tempData.push(cartItem);
            }
          }
        }
      }

      setCartData(tempData);

      // Separate cart items by country
      const nigeriaItems = tempData.filter(item =>
        item.product?.countryOfOrigin?.toLowerCase() === 'nigeria'
      );
      const chinaItems = tempData.filter(item =>
        item.product?.countryOfOrigin?.toLowerCase() === 'china'
      );

      setCartByCountry({ nigeria: nigeriaItems, china: chinaItems });

      // Auto-set shipping mode based on cart contents
      if (nigeriaItems.length > 0 && chinaItems.length === 0) {
        setShippingMode('land'); // Only Nigerian products
      } else if (chinaItems.length > 0) {
        setShippingMode('sea'); // Default for Chinese products
      }
    }

  }, [cartItems, products])

  // Helper function to calculate total weight of cart items
  const calculateTotalWeight = (items) => {
    return items.reduce((total, item) => {
      const weight = item.product?.weight || 1; // Default 1kg if no weight specified
      return total + (weight * item.quantity);
    }, 0);
  };

  // Helper function to calculate shipping cost
  const calculateShippingCost = (items, mode) => {
    const totalWeight = calculateTotalWeight(items);
    const rates = {
      air: 8500,    // 8500 FCFA per kg
      sea: 1100,    // 1100 FCFA per kg
      land: 1000    // 1000 FCFA per kg
    };
    return totalWeight * (rates[mode] || rates.sea);
  };

  // Get current cart items for checkout (based on country selection)
  const getCurrentCartItems = () => {
    if (selectedCountryForCheckout) {
      return cartByCountry[selectedCountryForCheckout] || [];
    }

    // If only one country has items, return those
    if (cartByCountry.nigeria.length > 0 && cartByCountry.china.length === 0) {
      return cartByCountry.nigeria;
    } else if (cartByCountry.china.length > 0 && cartByCountry.nigeria.length === 0) {
      return cartByCountry.china;
    }

    // If mixed cart, return all items (shouldn't happen in checkout)
    return cartData;
  };

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
        <div className='text-xl sm:text-2xl mb-3 self-start'>
          <Title text1='YOUR' text2='CART'/>
        </div>
        <div className='my-auto text-sm sm:text-base lg:text-lg flex flex-col items-center'>
          <p className='text-center'>Your cart is empty! Try to add some items first.</p>
          <Link to='/collection' 
            className='bg-black text-white text-sm sm:text-base mt-4 px-4 py-2 w-fit transistion-all duration-500 hover:bg-slate-700'>
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
    <div className='px-3 sm:px-14 border-t pt-8 sm:pt-14 animate-fade animate-duration-500 bg-gray-50 sm:bg-white min-h-screen'>
      <div className='text-lg sm:text-2xl mb-4 sm:mb-6 px-1 sm:px-0'>
        <Title text1='YOUR' text2='CART'/>
      </div>

      <div className='space-y-0 sm:space-y-0'>
        {
          cartData.map((item, index) => {
            try {
              const productData = products.find((product) => product && product._id === item.id);
              
              // Skip rendering if product not found
              if (!productData) return null;
              
              return (
                <div
                  key={index}
                  className='relative py-4 sm:py-6 border-t last:border-y text-gray-700
                    grid grid-cols-1 sm:grid-cols-[3fr_1fr_0.5fr_0.5fr]
                    items-start sm:items-center gap-3 sm:gap-4
                    bg-white sm:bg-transparent rounded-lg sm:rounded-none
                    p-3 sm:p-0 mb-3 sm:mb-0 shadow-sm sm:shadow-none'
                >
                  {/* Product info section */}
                  <div className='flex items-start gap-3 sm:gap-6'>
                    {/* Make image clickable */}
                    <div
                      onClick={() => navigate(`/product/${item.id}`)}
                      className="cursor-pointer hover:opacity-80 transition-opacity relative flex-shrink-0"
                    >
                      <img
                        className='w-20 h-20 sm:w-32 sm:h-32 object-cover rounded-lg border border-gray-100'
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
                    <div className='flex flex-col gap-2 sm:gap-3 flex-1 min-w-0'>
                      {/* Make product name clickable */}
                      <p
                        onClick={() => navigate(`/product/${item.id}`)}
                        className='text-sm sm:text-base lg:text-lg font-semibold cursor-pointer hover:text-blue-600 transition-colors line-clamp-2'
                      >
                        {productData.name}
                      </p>

                      {/* Mobile: Color and Size info in compact row */}
                      <div className='block sm:hidden'>
                        <div className='flex items-center gap-3 text-xs text-gray-600 mb-2'>
                          {item.color && (
                            <div className="flex items-center gap-1">
                              <div
                                className="w-3 h-3 rounded-full border border-gray-300"
                                style={{ backgroundColor: item.colorHex || '#ccc' }}
                              ></div>
                              <span className="font-medium">{item.color}</span>
                            </div>
                          )}
                          {item.size !== 'N/A' && (
                            <div className="flex items-center gap-1">
                              <span>Size:</span>
                              <span className="font-medium">{item.size}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Desktop: Color info with larger indicator */}
                      {item.color && (
                        <div className='hidden sm:flex items-center gap-2 text-xs sm:text-sm text-gray-600'>
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

                      {/* Mobile price with better styling */}
                      <div className='block sm:hidden bg-gray-50 px-3 py-2 rounded-md'>
                        <div className='flex justify-between items-center'>
                          <span className='text-xs text-gray-600'>Total:</span>
                          <span className='text-sm font-bold text-brand'>
                            <NumberFlow
                              value={productData.price * item.quantity}
                              format={{
                                style: 'currency',
                                currency: import.meta.env.VITE_CURRENCY || 'XAF',
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0
                              }}
                            />
                          </span>
                        </div>
                        <div className='flex justify-between items-center mt-1'>
                          <span className='text-xs text-gray-500'>
                            {new Intl.NumberFormat('fr-FR', {
                              minimumFractionDigits: 0
                            }).format(productData.price)} FCFA × {item.quantity}
                          </span>
                        </div>
                      </div>
                      {/* Mobile Controls - Organized in sections */}
                      <div className='block sm:hidden space-y-3 mt-3'>
                        {/* Color and Size Selection Row */}
                        <div className='flex items-center gap-2'>
                          {/* Color Selection */}
                          {productData.colors && productData.colors.length > 0 && (
                            <Select
                              value={item.color || ''}
                              onValueChange={(newColor) => handleColorChange(item, newColor)}
                            >
                              <SelectTrigger className="flex-1 h-9 text-xs">
                                <SelectValue placeholder="Color">
                                  {item.color && (
                                    <div className="flex items-center gap-2">
                                      <div
                                        className="w-3 h-3 rounded-full border border-gray-300 flex-shrink-0"
                                        style={{
                                          backgroundColor: item.colorHex || '#ccc'
                                        }}
                                      ></div>
                                      <span className="truncate text-xs">{item.color}</span>
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
                                        className="w-3 h-3 rounded-full border border-gray-300 flex-shrink-0"
                                        style={{ backgroundColor: colorOption.colorHex }}
                                      ></div>
                                      <span className="text-xs">{colorOption.colorName}</span>
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
                              <SelectTrigger className="w-20 h-9 text-xs">
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
                        </div>

                        {/* Quantity and Delete Row */}
                        <div className='flex items-center justify-between'>
                          <div className="flex items-center gap-2">
                            <span className='text-xs text-gray-600'>Qty:</span>
                            <div className="flex items-center border rounded-md bg-white">
                              {/* Decrement Button */}
                              <button
                                onClick={() => {
                                  const newValue = Math.max(1, item.quantity - 1)
                                  updateQuantity(item.id, item.cartKey, newValue)
                                  validateInventory(item.id, item.size, item.colorHex, newValue)
                                }}
                                disabled={item.quantity <= 1}
                                className="flex items-center justify-center w-8 h-9 text-gray-600 hover:text-gray-800 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-l-md"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                </svg>
                              </button>

                              {/* Quantity Input */}
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
                                className='w-12 h-9 text-center text-sm border-0 border-l border-r border-gray-200 focus:outline-none focus:ring-0'
                              />

                              {/* Increment Button */}
                              <button
                                onClick={() => {
                                  const newValue = item.quantity + 1
                                  updateQuantity(item.id, item.cartKey, newValue)
                                  validateInventory(item.id, item.size, item.colorHex, newValue)
                                }}
                                className="flex items-center justify-center w-8 h-9 text-gray-600 hover:text-gray-800 hover:bg-gray-50 transition-colors rounded-r-md"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                              </button>
                            </div>
                          </div>

                          {/* Mobile delete button */}
                          <button
                            onClick={() => {
                              updateQuantity(item.id, item.cartKey, 0);
                            }}
                            className='flex items-center gap-1 px-3 py-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors'
                          >
                            <img
                              src={assets.deleteIcon}
                              alt='Remove item'
                              className='w-4 h-4'
                            />
                            <span className='text-xs'>Remove</span>
                          </button>
                        </div>
                      </div>

                      {/* Desktop Controls - Keep original layout */}
                      <div className='hidden sm:flex items-center gap-2 flex-wrap'>
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
                                    <span className="truncate text-xs sm:text-sm">{item.color}</span>
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
                                    <span className="text-xs sm:text-sm">{colorOption.colorName}</span>
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
                      </div>
                      {inventoryErrors[`${item.id}-${item.size}-${item.colorHex || 'default'}`] && (
                        <span className="text-red-500 text-xs sm:text-sm font-bold">
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
                      currency: import.meta.env.VITE_CURRENCY || 'XAF',
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0
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


      {/* Mobile: Full width cart total */}
      <div className='block sm:hidden mt-8 mb-6'>
        <div className='bg-white rounded-lg shadow-sm border p-4'>
          <CartTotal />

          {/* Country Selection for Mixed Cart */}
          {cartByCountry.nigeria.length > 0 && cartByCountry.china.length > 0 && (
            <div className='mt-4 p-3 bg-blue-50 rounded-md border border-blue-200'>
              <h3 className='font-semibold mb-3 text-sm text-blue-800'>Select Country to Checkout</h3>
              <p className='text-xs text-blue-600 mb-3'>Your cart contains items from different countries. Please checkout each country separately.</p>
              <div className='space-y-2'>
                <button
                  onClick={() => setSelectedCountryForCheckout('nigeria')}
                  className={`w-full p-2 rounded-md text-sm font-medium transition-colors ${
                    selectedCountryForCheckout === 'nigeria'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-blue-300 text-blue-700 hover:bg-blue-50'
                  }`}
                >
                  Nigeria ({cartByCountry.nigeria.length} items) - Land Shipping
                </button>
                <button
                  onClick={() => setSelectedCountryForCheckout('china')}
                  className={`w-full p-2 rounded-md text-sm font-medium transition-colors ${
                    selectedCountryForCheckout === 'china'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-blue-300 text-blue-700 hover:bg-blue-50'
                  }`}
                >
                  China ({cartByCountry.china.length} items) - Air/Sea Shipping
                </button>
              </div>
            </div>
          )}

          {/* Shipping Mode Selection for Chinese Products */}
          {((cartByCountry.china.length > 0 && cartByCountry.nigeria.length === 0) ||
            selectedCountryForCheckout === 'china') && (
            <div className='mt-4 p-3 bg-gray-50 rounded-md'>
              <h3 className='font-semibold mb-3 text-sm text-gray-800'>Shipping Method</h3>
              <div className='space-y-2'>
                <label className='flex items-center gap-2 cursor-pointer'>
                  <input
                    type='radio'
                    name='shippingMode'
                    value='sea'
                    checked={shippingMode === 'sea'}
                    onChange={(e) => setShippingMode(e.target.value)}
                    className='text-brand'
                  />
                  <div className='flex-1'>
                    <div className='flex justify-between items-center'>
                      <span className='text-sm font-medium'>Sea Shipping</span>
                      <span className='text-sm text-brand font-semibold'>1,100 FCFA/kg</span>
                    </div>
                    <div className='text-xs text-gray-500'>Normal delivery (15-25 days)</div>
                  </div>
                </label>
                <label className='flex items-center gap-2 cursor-pointer'>
                  <input
                    type='radio'
                    name='shippingMode'
                    value='air'
                    checked={shippingMode === 'air'}
                    onChange={(e) => setShippingMode(e.target.value)}
                    className='text-brand'
                  />
                  <div className='flex-1'>
                    <div className='flex justify-between items-center'>
                      <span className='text-sm font-medium'>Air Shipping</span>
                      <span className='text-sm text-brand font-semibold'>8,500 FCFA/kg</span>
                    </div>
                    <div className='text-xs text-gray-500'>Express delivery (5-10 days)</div>
                  </div>
                </label>
              </div>
            </div>
          )}

          <div className='mt-4 p-3 bg-gray-50 rounded-md'>
            <h3 className='font-semibold mb-3 text-sm text-gray-800'>Delivery Information</h3>
            <div className='space-y-2 text-sm'>
              <div className='flex justify-between items-center'>
                <span className='text-gray-600'>Shipping Fee:</span>
                <div className='text-right'>
                  <span className='font-semibold text-gray-900'>
                    {(() => {
                      const currentItems = getCurrentCartItems();
                      const currentMode = cartByCountry.nigeria.length > 0 && cartByCountry.china.length === 0 ? 'land' : shippingMode;
                      const shippingCost = calculateShippingCost(currentItems, currentMode);
                      return `${import.meta.env.VITE_CURRENCY_SYMBOL || 'FCFA'} ${new Intl.NumberFormat('fr-FR').format(shippingCost)}`;
                    })()}
                  </span>
                  <div className='text-xs text-orange-600 font-medium'>Pay on delivery</div>
                </div>
              </div>
              <div className='flex justify-between items-center'>
                <span className='text-gray-600'>Total Weight:</span>
                <span className='font-semibold text-gray-900'>
                  {calculateTotalWeight(getCurrentCartItems()).toFixed(1)} kg
                </span>
              </div>
              <div className='flex justify-between items-center'>
                <span className='text-gray-600'>Delivery Time:</span>
                <span className='font-semibold text-gray-900'>
                  {(() => {
                    if (cartByCountry.nigeria.length > 0 && cartByCountry.china.length === 0) return '3-5 days';
                    if (selectedCountryForCheckout === 'nigeria') return '3-5 days';
                    return shippingMode === 'air' ? '5-10 days' : '15-25 days';
                  })()}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              // Store shipping info in localStorage for checkout
              const checkoutData = {
                shippingMode: cartByCountry.nigeria.length > 0 && cartByCountry.china.length === 0 ? 'land' : shippingMode,
                selectedCountry: selectedCountryForCheckout || (cartByCountry.nigeria.length > 0 ? 'nigeria' : 'china'),
                cartItems: getCurrentCartItems()
              };
              localStorage.setItem('checkoutData', JSON.stringify(checkoutData));

              if (token) {
                navigate('/place-order');
              } else {
                navigate('/login', { state: { from: '/cart' } });
              }
            }}
            disabled={hasStockError || (cartByCountry.nigeria.length > 0 && cartByCountry.china.length > 0 && !selectedCountryForCheckout)}
            className={`w-full mt-4 py-4 rounded-lg font-semibold text-sm transition-all duration-300
              ${hasStockError || (cartByCountry.nigeria.length > 0 && cartByCountry.china.length > 0 && !selectedCountryForCheckout)
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-brand text-white hover:bg-brand-dark shadow-md hover:shadow-lg'
              }`}
          >
            {hasStockError
              ? 'Fix stock issues to continue'
              : (cartByCountry.nigeria.length > 0 && cartByCountry.china.length > 0 && !selectedCountryForCheckout)
                ? 'Select country to continue'
                : 'Proceed to Checkout'
            }
          </button>
        </div>
      </div>

      {/* Desktop: Right-aligned cart total */}
      <div className='hidden sm:flex justify-end my-20'>
        <div className='w-full sm:w-1/3 mt-8 sm:mt-0'>
          <CartTotal />

          {/* Country Selection for Mixed Cart */}
          {cartByCountry.nigeria.length > 0 && cartByCountry.china.length > 0 && (
            <div className='mt-4 p-4 bg-blue-50 rounded-md border border-blue-200'>
              <h3 className='font-medium mb-3 text-sm text-blue-800'>Select Country to Checkout</h3>
              <p className='text-xs text-blue-600 mb-3'>Your cart contains items from different countries. Please checkout each country separately.</p>
              <div className='space-y-2'>
                <button
                  onClick={() => setSelectedCountryForCheckout('nigeria')}
                  className={`w-full p-2 rounded-md text-sm font-medium transition-colors ${
                    selectedCountryForCheckout === 'nigeria'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-blue-300 text-blue-700 hover:bg-blue-50'
                  }`}
                >
                  Nigeria ({cartByCountry.nigeria.length} items) - Land Shipping
                </button>
                <button
                  onClick={() => setSelectedCountryForCheckout('china')}
                  className={`w-full p-2 rounded-md text-sm font-medium transition-colors ${
                    selectedCountryForCheckout === 'china'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-blue-300 text-blue-700 hover:bg-blue-50'
                  }`}
                >
                  China ({cartByCountry.china.length} items) - Air/Sea Shipping
                </button>
              </div>
            </div>
          )}

          {/* Shipping Mode Selection for Chinese Products */}
          {((cartByCountry.china.length > 0 && cartByCountry.nigeria.length === 0) ||
            selectedCountryForCheckout === 'china') && (
            <div className='mt-4 p-4 bg-gray-50 rounded-md'>
              <h3 className='font-medium mb-3 text-sm text-gray-800'>Shipping Method</h3>
              <div className='space-y-2'>
                <label className='flex items-center gap-2 cursor-pointer'>
                  <input
                    type='radio'
                    name='shippingModeDesktop'
                    value='sea'
                    checked={shippingMode === 'sea'}
                    onChange={(e) => setShippingMode(e.target.value)}
                    className='text-brand'
                  />
                  <div className='flex-1'>
                    <div className='flex justify-between items-center'>
                      <span className='text-sm font-medium'>Sea Shipping</span>
                      <span className='text-sm text-brand font-semibold'>1,100 FCFA/kg</span>
                    </div>
                    <div className='text-xs text-gray-500'>Normal delivery (15-25 days)</div>
                  </div>
                </label>
                <label className='flex items-center gap-2 cursor-pointer'>
                  <input
                    type='radio'
                    name='shippingModeDesktop'
                    value='air'
                    checked={shippingMode === 'air'}
                    onChange={(e) => setShippingMode(e.target.value)}
                    className='text-brand'
                  />
                  <div className='flex-1'>
                    <div className='flex justify-between items-center'>
                      <span className='text-sm font-medium'>Air Shipping</span>
                      <span className='text-sm text-brand font-semibold'>8,500 FCFA/kg</span>
                    </div>
                    <div className='text-xs text-gray-500'>Express delivery (5-10 days)</div>
                  </div>
                </label>
              </div>
            </div>
          )}

          <div className='mt-4 p-4 bg-gray-50 rounded-md'>
            <h3 className='font-medium mb-2 text-xs sm:text-sm'>Delivery Details</h3>
            <div className='flex flex-col gap-2 text-xs sm:text-sm'>
              <div className='flex justify-between'>
                <p>Shipping Fee:</p>
                <div className='text-right'>
                  <p className='font-medium'>
                    {(() => {
                      const currentItems = getCurrentCartItems();
                      const currentMode = cartByCountry.nigeria.length > 0 && cartByCountry.china.length === 0 ? 'land' : shippingMode;
                      const shippingCost = calculateShippingCost(currentItems, currentMode);
                      return `${import.meta.env.VITE_CURRENCY_SYMBOL || 'FCFA'} ${new Intl.NumberFormat('fr-FR').format(shippingCost)}`;
                    })()}
                  </p>
                  <p className='text-xs text-orange-600 font-medium'>Pay on delivery</p>
                </div>
              </div>
              <div className='flex justify-between'>
                <p>Total Weight:</p>
                <p className='font-medium'>{calculateTotalWeight(getCurrentCartItems()).toFixed(1)} kg</p>
              </div>
              <div className='flex justify-between'>
                <p>Estimated Delivery Time:</p>
                <p className='font-medium'>
                  {(() => {
                    if (cartByCountry.nigeria.length > 0 && cartByCountry.china.length === 0) return '3-5 days';
                    if (selectedCountryForCheckout === 'nigeria') return '3-5 days';
                    return shippingMode === 'air' ? '5-10 days' : '15-25 days';
                  })()}
                </p>
              </div>
            </div>
          </div>

          <div className='w-full text-end'>
            <button
              onClick={() => {
                // Store shipping info in localStorage for checkout
                const checkoutData = {
                  shippingMode: cartByCountry.nigeria.length > 0 && cartByCountry.china.length === 0 ? 'land' : shippingMode,
                  selectedCountry: selectedCountryForCheckout || (cartByCountry.nigeria.length > 0 ? 'nigeria' : 'china'),
                  cartItems: getCurrentCartItems()
                };
                localStorage.setItem('checkoutData', JSON.stringify(checkoutData));

                if (token) {
                  navigate('/place-order');
                } else {
                  navigate('/login', { state: { from: '/cart' } });
                }
              }}
              disabled={hasStockError || (cartByCountry.nigeria.length > 0 && cartByCountry.china.length > 0 && !selectedCountryForCheckout)}
              className={`bg-brand text-white text-xs sm:text-sm my-8 px-4 py-3 transition-all duration-500
                ${hasStockError || (cartByCountry.nigeria.length > 0 && cartByCountry.china.length > 0 && !selectedCountryForCheckout)
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-brand-dark'
                }`}
            >
              {hasStockError
                ? 'Fix stock issues to continue'
                : (cartByCountry.nigeria.length > 0 && cartByCountry.china.length > 0 && !selectedCountryForCheckout)
                  ? 'Select country to continue'
                  : 'Proceed to checkout'
              }
            </button>
          </div>
        </div>
      </div>

      {/* Related products section */}
      <div className="mt-8 sm:mt-20 border-t pt-6 sm:pt-10 bg-white sm:bg-transparent mx-0 sm:mx-0 px-0 sm:px-0">
        <div className="mb-4 sm:mb-8 px-3 sm:px-0">
          <Title text1="RELATED" text2="PRODUCTS" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 px-3 sm:px-0">
          {getRelatedProducts().map((product) => (
            product && ( // Add check to ensure product exists
              <div
                key={product._id}
                onClick={() => navigate(`/product/${product._id}`)}
                className="cursor-pointer group bg-white sm:bg-transparent rounded-lg sm:rounded-none p-2 sm:p-0 shadow-sm sm:shadow-none border sm:border-none"
              >
                <div className="aspect-square mb-2 overflow-hidden rounded-md sm:rounded-none">
                  <img
                    src={product.image && product.image.length > 0 ? product.image[0] : ''}
                    alt={product.name || 'Product'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <p className="text-xs sm:text-sm font-medium transition-colors line-clamp-2 mb-1">
                  {product.name || 'Product'}
                </p>
                <p className="text-xs sm:text-sm text-brand font-semibold">
                  <NumberFlow
                    value={product.price || 0}
                    format={{
                      style: 'currency',
                      currency: import.meta.env.VITE_CURRENCY || 'XAF',
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0
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
