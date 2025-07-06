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

  const [selectedCountryView, setSelectedCountryView] = useState('all') // 'all', 'nigeria', 'china'
  
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

  
  const flagImages = {
    Nigeria: "https://flagcdn.com/w320/ng.png",
    China: "https://flagcdn.com/w320/cn.png"
  }


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

  // Calculate total shipping cost for mixed cart (both countries)
  const calculateTotalShippingCost = () => {
    let totalCost = 0;

    // Calculate Nigeria shipping (always land)
    if (cartByCountry.nigeria.length > 0) {
      totalCost += calculateShippingCost(cartByCountry.nigeria, 'land');
    }

    // Calculate China shipping (air or sea based on selection)
    if (cartByCountry.china.length > 0) {
      totalCost += calculateShippingCost(cartByCountry.china, shippingMode);
    }

    return totalCost;
  };

  // Bulk discount configuration from environment variables
  const bulkDiscountPercentage = Number(import.meta.env.VITE_BULK_DISCOUNT_PERCENTAGE) || 5;
  const bulkDiscountMinQuantity = Number(import.meta.env.VITE_BULK_DISCOUNT_MIN_QUANTITY) || 10;

  // Helper function to check if item qualifies for bulk discount
  const qualifiesForBulkDiscount = (quantity) => {
    return quantity >= bulkDiscountMinQuantity;
  };

  // Helper function to calculate discounted price for an item
  const calculateDiscountedPrice = (originalPrice, quantity) => {
    if (qualifiesForBulkDiscount(quantity)) {
      const discountAmount = originalPrice * (bulkDiscountPercentage / 100);
      return originalPrice - discountAmount;
    }
    return originalPrice;
  };

  // Helper function to calculate total discount amount for an item
  const calculateDiscountAmount = (originalPrice, quantity) => {
    if (qualifiesForBulkDiscount(quantity)) {
      return originalPrice * (bulkDiscountPercentage / 100);
    }
    return 0;
  };

  // Helper function to calculate item total with discount
  const calculateItemTotal = (originalPrice, quantity) => {
    const discountedPrice = calculateDiscountedPrice(originalPrice, quantity);
    return discountedPrice * quantity;
  };

  // Get current cart items for display (based on country view selector)
  const getCurrentCartItems = () => {
    // If user has selected a specific country view, show only that country's items
    if (selectedCountryView === 'nigeria') {
      return cartByCountry.nigeria;
    } else if (selectedCountryView === 'china') {
      return cartByCountry.china;
    } else {
      // Show all items (default view)
      return cartData;
    }
  };

  // Get current cart items for checkout (based on country view selection)
  const getCheckoutItems = () => {
    // If user has selected a specific country view, use that for checkout
    if (selectedCountryView === 'nigeria') {
      return cartByCountry.nigeria;
    } else if (selectedCountryView === 'china') {
      return cartByCountry.china;
    }

    // If "all" is selected, determine based on cart contents
    if (cartByCountry.nigeria.length > 0 && cartByCountry.china.length === 0) {
      return cartByCountry.nigeria;
    } else if (cartByCountry.china.length > 0 && cartByCountry.nigeria.length === 0) {
      return cartByCountry.china;
    }

    // If mixed cart and "all" selected, return all items
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
    <div className='px-3 sm:px-14 border-t pt-8 sm:pt-14 animate-fade animate-duration-500 bg-gray-50 sm:bg-white min-h-screen pb-24 sm:pb-0'>
      <div className='text-lg sm:text-2xl mb-4 sm:mb-6 px-1 sm:px-0'>
        <Title text1='YOUR' text2='CART'/>
      </div>

      {/* Mixed Cart Message */}
      {cartByCountry.nigeria.length > 0 && cartByCountry.china.length > 0 && (
        <div className="hidden sm:block lg:blog bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-sm font-semibold text-blue-800 mb-1">Multiple Countries in Cart</h3>
              
              <p className="text-xs text-blue-600">
                Use the country selector below to view items by country, then select a country to proceed with checkout.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Country Selector - Collection Page Style */}
      {(cartByCountry.nigeria.length > 0 || cartByCountry.china.length > 0) && (
        <div className="mb-6">
          {/* Desktop View */}
          <div className="hidden sm:flex items-center gap-4 flex-wrap">
            <span className="text-sm font-medium text-gray-700">View cart by country:</span>
            <div className="flex items-center gap-2">
              {/* All Countries Button */}
              <button
                onClick={() => setSelectedCountryView('all')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  selectedCountryView === 'all'
                    ? 'bg-brand text-white shadow-md'
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                All Countries ({cartData.length})
              </button>

              {/* Nigeria Button */}
              {cartByCountry.nigeria.length > 0 && (
                <button
                  onClick={() => setSelectedCountryView('nigeria')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    selectedCountryView === 'nigeria'
                      ? 'bg-brand text-white shadow-md'
                      : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <img src={flagImages.Nigeria} alt="Nigeria" className="w-4 h-3 object-cover rounded-sm" />
                  Nigeria ({cartByCountry.nigeria.length})
                </button>
              )}

              {/* China Button */}
              {cartByCountry.china.length > 0 && (
                <button
                  onClick={() => setSelectedCountryView('china')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    selectedCountryView === 'china'
                      ? 'bg-brand text-white shadow-md'
                      : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <img src={flagImages.China} alt="China" className="w-4 h-3 object-cover rounded-sm" />
                  China ({cartByCountry.china.length})
                </button>
              )}
            </div>
          </div>

          {/* Mobile View - Collection Page Style */}
          <div className="block sm:hidden">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">View by country:</span>
              <span className="text-xs text-gray-500">
                {selectedCountryView === 'all' ? `${cartData.length} items` :
                 selectedCountryView === 'nigeria' ? `${cartByCountry.nigeria.length} items` :
                 `${cartByCountry.china.length} items`}
              </span>
            </div>

            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {/* All Countries - Mobile */}
              <button
                onClick={() => setSelectedCountryView('all')}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200 min-w-[60px] ${
                  selectedCountryView === 'all'
                    ? 'bg-brand text-white shadow-lg scale-105'
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  selectedCountryView === 'all' ? 'bg-white/20' : 'bg-gray-100'
                }`}>
                  <svg className={`w-4 h-4 ${selectedCountryView === 'all' ? 'text-white' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-xs font-medium">All</span>
                <span className="text-xs opacity-75">({cartData.length})</span>
              </button>

              {/* Nigeria - Mobile */}
              {cartByCountry.nigeria.length > 0 && (
                <button
                  onClick={() => setSelectedCountryView('nigeria')}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200 min-w-[60px] ${
                    selectedCountryView === 'nigeria'
                      ? 'bg-brand text-white shadow-lg scale-105'
                      : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full overflow-hidden border-2 ${
                    selectedCountryView === 'nigeria' ? 'border-white/30' : 'border-gray-200'
                  }`}>
                    <img
                      src={flagImages.Nigeria}
                      alt="Nigeria"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-xs font-medium">Nigeria</span>
                  <span className="text-xs opacity-75">({cartByCountry.nigeria.length})</span>
                </button>
              )}

              {/* China - Mobile */}
              {cartByCountry.china.length > 0 && (
                <button
                  onClick={() => setSelectedCountryView('china')}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200 min-w-[60px] ${
                    selectedCountryView === 'china'
                      ? 'bg-brand text-white shadow-lg scale-105'
                      : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full overflow-hidden border-2 ${
                    selectedCountryView === 'china' ? 'border-white/30' : 'border-gray-200'
                  }`}>
                    <img
                      src={flagImages.China}
                      alt="China"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-xs font-medium">China</span>
                  <span className="text-xs opacity-75">({cartByCountry.china.length})</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Side by side layout for cart items and cart total */}
      <div className='flex flex-col lg:flex-row gap-8'>
        {/* Left side: Cart items */}
        <div className='flex-1'>
          <div className='space-y-0 sm:space-y-0'>
            {
              getCurrentCartItems().map((item, index) => {
            try {
              const productData = products.find((product) => product && product._id === item.id);
              
              // Skip rendering if product not found
              if (!productData) return null;
              
              return (
                <div
                  key={index}
                  className='relative py-2 sm:py-6 border-t last:border-y text-gray-700
                    grid grid-cols-1 sm:grid-cols-[3fr_1fr_0.5fr_0.5fr]
                    items-start sm:items-center gap-2 sm:gap-4
                    bg-white sm:bg-transparent rounded-lg sm:rounded-none
                    p-2 sm:p-0 mb-2 sm:mb-0 shadow-sm sm:shadow-none'
                >
                  {/* Product info section */}
                  <div className='flex items-start gap-2 sm:gap-6'>
                    {/* Make image clickable */}
                    <div
                      onClick={() => navigate(`/product/${item.id}`)}
                      className="cursor-pointer hover:opacity-80 transition-opacity relative flex-shrink-0"
                    >
                      <img
                        className='w-16 h-16 sm:w-32 sm:h-32 object-cover rounded-md border border-gray-100'
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
                    <div className='flex flex-col gap-1 sm:gap-3 flex-1 min-w-0'>
                      {/* Make product name clickable */}
                      <p
                        onClick={() => navigate(`/product/${item.id}`)}
                        className='text-xs sm:text-base lg:text-lg font-semibold cursor-pointer hover:text-blue-600 transition-colors line-clamp-2 leading-tight'
                      >
                        {productData.name}
                      </p>

                      {/* Mobile: Color and Size info in compact row */}
                      <div className='block sm:hidden'>
                        <div className='flex items-center gap-2 text-xs text-gray-600 mb-1'>
                          {item.color && (
                            <div className="flex items-center gap-1">
                              <div
                                className="w-2.5 h-2.5 rounded-full border border-gray-300"
                                style={{ backgroundColor: item.colorHex || '#ccc' }}
                              ></div>
                              <span className="font-medium text-xs">{item.color}</span>
                            </div>
                          )}
                          {item.size !== 'N/A' && (
                            <div className="flex items-center gap-1">
                              <span className="text-xs">Size:</span>
                              <span className="font-medium text-xs">{item.size}</span>
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

                      {/* Mobile price with better styling and bulk discount */}
                      <div className='block sm:hidden bg-gray-50 px-2 py-1.5 rounded-md'>
                        {/* Check if item qualifies for bulk discount */}
                        {qualifiesForBulkDiscount(item.quantity) ? (
                          <>
                            {/* Discounted Price Display */}
                            <div className='flex justify-between items-center'>
                              <span className='text-xs text-gray-600'>Total:</span>
                              <span className='text-sm font-bold text-brand'>
                                <NumberFlow
                                  value={calculateItemTotal(productData.price, item.quantity)}
                                  format={{
                                    style: 'currency',
                                    currency: import.meta.env.VITE_CURRENCY || 'XAF',
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0
                                  }}
                                />
                              </span>
                            </div>
                            {/* Original Price (Crossed Out) */}
                            <div className='flex justify-between items-center'>
                              <span className='text-xs text-green-600 font-medium'>
                                -{bulkDiscountPercentage}% bulk discount
                              </span>
                              <span className='text-xs text-gray-400 line-through'>
                                {new Intl.NumberFormat('fr-FR', {
                                  minimumFractionDigits: 0
                                }).format(productData.price * item.quantity)} FCFA
                              </span>
                            </div>
                            {/* Price Breakdown */}
                            <div className='flex justify-between items-center'>
                              <span className='text-xs text-gray-500'>
                                {new Intl.NumberFormat('fr-FR', {
                                  minimumFractionDigits: 0
                                }).format(calculateDiscountedPrice(productData.price, item.quantity))} FCFA × {item.quantity}
                              </span>
                            </div>
                          </>
                        ) : (
                          <>
                            {/* Regular Price Display */}
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
                            <div className='flex justify-between items-center'>
                              <span className='text-xs text-gray-500'>
                                {new Intl.NumberFormat('fr-FR', {
                                  minimumFractionDigits: 0
                                }).format(productData.price)} FCFA × {item.quantity}
                              </span>
                              {/* Show how many more items needed for discount */}
                              {item.quantity < bulkDiscountMinQuantity && (
                                <span className='text-xs text-blue-600'>
                                  +{bulkDiscountMinQuantity - item.quantity} for {bulkDiscountPercentage}% off
                                </span>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                      {/* Mobile Controls - Organized in sections */}
                      <div className='block sm:hidden space-y-2 mt-2'>
                        {/* Color and Size Selection Row */}
                        <div className='flex items-center gap-1.5'>
                          {/* Color Selection */}
                          {productData.colors && productData.colors.length > 0 && (
                            <Select
                              value={item.color || ''}
                              onValueChange={(newColor) => handleColorChange(item, newColor)}
                            >
                              <SelectTrigger className="flex-1 h-8 text-xs">
                                <SelectValue placeholder="Color">
                                  {item.color && (
                                    <div className="flex items-center gap-1.5">
                                      <div
                                        className="w-2.5 h-2.5 rounded-full border border-gray-300 flex-shrink-0"
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
                              <SelectTrigger className="w-16 h-8 text-xs">
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
                          <div className="flex items-center gap-1.5">
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
                                className="flex items-center justify-center w-6 h-7 text-gray-600 hover:text-gray-800 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-l-md"
                              >
                                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                                className='w-10 h-7 text-center text-xs border-0 border-l border-r border-gray-200 focus:outline-none focus:ring-0'
                              />

                              {/* Increment Button */}
                              <button
                                onClick={() => {
                                  const newValue = item.quantity + 1
                                  updateQuantity(item.id, item.cartKey, newValue)
                                  validateInventory(item.id, item.size, item.colorHex, newValue)
                                }}
                                className="flex items-center justify-center w-6 h-7 text-gray-600 hover:text-gray-800 hover:bg-gray-50 transition-colors rounded-r-md"
                              >
                                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                            className='flex items-center gap-1 px-2 py-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors'
                          >
                            <img
                              src={assets.deleteIcon}
                              alt='Remove item'
                              className='w-3 h-3'
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

                  {/* Desktop price with bulk discount - hidden on mobile */}
                  <div className='hidden sm:block w-fit mx-auto text-center'>
                    {qualifiesForBulkDiscount(item.quantity) ? (
                      <div className="space-y-1">
                        {/* Discounted Price */}
                        <NumberFlow
                          className='text-brand font-semibold'
                          value={calculateItemTotal(productData.price, item.quantity)}
                          format={{
                            style: 'currency',
                            currency: import.meta.env.VITE_CURRENCY || 'XAF',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                          }}
                        />
                        {/* Original Price (Crossed Out) */}
                        <div className="text-xs text-gray-400 line-through">
                          {new Intl.NumberFormat('fr-FR', {
                            minimumFractionDigits: 0
                          }).format(productData.price * item.quantity)} FCFA
                        </div>
                        {/* Discount Badge */}
                        <div className="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded-full">
                          -{bulkDiscountPercentage}% bulk
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {/* Regular Price */}
                        <NumberFlow
                          className='text-brand font-semibold'
                          value={productData.price * item.quantity}
                          format={{
                            style: 'currency',
                            currency: import.meta.env.VITE_CURRENCY || 'XAF',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                          }}
                        />
                        {/* Discount Incentive */}
                        {item.quantity < bulkDiscountMinQuantity && (
                          <div className="text-xs text-blue-600">
                            +{bulkDiscountMinQuantity - item.quantity} for {bulkDiscountPercentage}% off
                          </div>
                        )}
                      </div>
                    )}
                  </div>

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
        </div>

        {/* Right side: Cart total */}
        <div className='w-full lg:w-96 flex-shrink-0'>
          <div className='sticky top-8'>
            <div className='bg-white rounded-lg shadow-sm border p-4'>
              <CartTotal />

              {/* Shipping Mode Selection for Chinese Products */}
              {((cartByCountry.china.length > 0 && cartByCountry.nigeria.length === 0) ||
                selectedCountryView === 'china') && (
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

              {/* Delivery Information */}
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
                    <span className='font-semibold text-gray-900'>{calculateTotalWeight(getCurrentCartItems()).toFixed(1)} kg</span>
                  </div>
                  <div className='flex justify-between items-center'>
                    <span className='text-gray-600'>Estimated Delivery:</span>
                    <span className='font-semibold text-gray-900'>
                      {(() => {
                        if (selectedCountryView === 'nigeria' || (cartByCountry.nigeria.length > 0 && cartByCountry.china.length === 0)) return '3-5 days';
                        if (selectedCountryView === 'china') return shippingMode === 'air' ? '5-10 days' : '15-25 days';
                        return shippingMode === 'air' ? '5-10 days' : '15-25 days';
                      })()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Checkout Button */}
              <div className='w-full text-center mt-6'>
                <button
                  onClick={() => {
                    // Store shipping info in localStorage for checkout
                    const checkoutData = {
                      shippingMode: (() => {
                        if (selectedCountryView === 'nigeria' || (cartByCountry.nigeria.length > 0 && cartByCountry.china.length === 0)) {
                          return 'land';
                        }
                        return shippingMode;
                      })(),
                      selectedCountry: (() => {
                        if (selectedCountryView === 'nigeria') return 'nigeria';
                        if (selectedCountryView === 'china') return 'china';
                        return cartByCountry.nigeria.length > 0 ? 'nigeria' : 'china';
                      })(),
                      cartItems: getCheckoutItems()
                    };
                    localStorage.setItem('checkoutData', JSON.stringify(checkoutData));

                    if (token) {
                      navigate('/place-order');
                    } else {
                      navigate('/login', { state: { from: '/cart' } });
                    }
                  }}
                  disabled={hasStockError || (cartByCountry.nigeria.length > 0 && cartByCountry.china.length > 0 && selectedCountryView === 'all')}
                  className={`bg-brand text-white text-sm py-3 px-6 transition-all duration-500 w-full rounded-md
                    ${hasStockError || (cartByCountry.nigeria.length > 0 && cartByCountry.china.length > 0 && selectedCountryView === 'all')
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-brand-dark'
                    }`}
                >
                  {hasStockError
                    ? 'Fix stock issues to continue'
                    : (cartByCountry.nigeria.length > 0 && cartByCountry.china.length > 0 && selectedCountryView === 'all')
                      ? 'Select country to continue'
                      : 'Proceed to checkout'
                  }
                </button>
              </div>
            </div>
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

      {/* Fixed Mobile Checkout Button with Total */}
      <div className='block sm:hidden fixed bottom-0 left-0 right-0 z-50'>
        <div className="bg-white shadow-2xl border-t border-gray-200 p-3 space-y-2">
          {/* Compact Total Amount Display */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-700">Total:</span>
              <div className="text-sm font-bold text-gray-900">
                <NumberFlow
                  value={(() => {
                    // Use current cart items based on country view selection
                    const currentItems = getCurrentCartItems();
                    return currentItems.reduce((total, item) => {
                      const product = products.find(p => p._id === item.id);
                      if (product) {
                        // Use discounted price calculation
                        return total + calculateItemTotal(product.price, item.quantity);
                      }
                      return total;
                    }, 0);
                  })()}
                  format={{
                    style: 'currency',
                    currency: import.meta.env.VITE_CURRENCY || 'XAF',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  }}
                />
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500">
                {(() => {
                  const currentItems = getCurrentCartItems();
                  return `${currentItems.length} item${currentItems.length !== 1 ? 's' : ''}`;
                })()}
              </div>
              {/* Show bulk discount savings if any */}
              {(() => {
                const currentItems = getCurrentCartItems();
                const totalSavings = currentItems.reduce((savings, item) => {
                  const product = products.find(p => p._id === item.id);
                  if (product && qualifiesForBulkDiscount(item.quantity)) {
                    const originalTotal = product.price * item.quantity;
                    const discountedTotal = calculateItemTotal(product.price, item.quantity);
                    return savings + (originalTotal - discountedTotal);
                  }
                  return savings;
                }, 0);

                return totalSavings > 0 ? (
                  <div className="text-xs text-green-600 font-medium">
                    Saved: {new Intl.NumberFormat('fr-FR', {
                      minimumFractionDigits: 0
                    }).format(totalSavings)} FCFA
                  </div>
                ) : null;
              })()}
            </div>
          </div>

          {/* Compact Delivery Method Selection - Mobile */}
          {(() => {
            // Show delivery method based on selected country view
            if (selectedCountryView === 'nigeria') {
              // Nigeria only - show land shipping (fixed)
              return (
                <div className="bg-green-50 rounded-md p-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-green-800">Delivery:</span>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                        <span className="text-xs text-green-800 font-medium">Land (1,000/kg)</span>
                      </div>
                      <span className="text-xs text-green-600">3-5 days</span>
                    </div>
                  </div>
                </div>
              );
            } else if (selectedCountryView === 'china') {
              // China only - show air/sea options
              return (
                <div className="bg-blue-50 rounded-md p-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-blue-800">Delivery:</span>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name="shippingModeMobile"
                          value="sea"
                          checked={shippingMode === 'sea'}
                          onChange={(e) => setShippingMode(e.target.value)}
                          className="text-blue-600 w-3 h-3"
                        />
                        <span className="text-xs text-blue-800">Sea (1,100/kg)</span>
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name="shippingModeMobile"
                          value="air"
                          checked={shippingMode === 'air'}
                          onChange={(e) => setShippingMode(e.target.value)}
                          className="text-blue-600 w-3 h-3"
                        />
                        <span className="text-xs text-blue-800">Air (8,500/kg)</span>
                      </label>
                    </div>
                  </div>
                </div>
              );
            } else if (selectedCountryView === 'all' && cartByCountry.china.length > 0) {
              // Mixed cart with "all" selected - show China options (since Nigeria is fixed)
              return (
                <div className="bg-blue-50 rounded-md p-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-blue-800">China Delivery:</span>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name="shippingModeMobile"
                          value="sea"
                          checked={shippingMode === 'sea'}
                          onChange={(e) => setShippingMode(e.target.value)}
                          className="text-blue-600 w-3 h-3"
                        />
                        <span className="text-xs text-blue-800">Sea (1,100/kg)</span>
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name="shippingModeMobile"
                          value="air"
                          checked={shippingMode === 'air'}
                          onChange={(e) => setShippingMode(e.target.value)}
                          className="text-blue-600 w-3 h-3"
                        />
                        <span className="text-xs text-blue-800">Air (8,500/kg)</span>
                      </label>
                    </div>
                  </div>
                </div>
              );
            }
            return null; // No delivery method selection needed
          })()}

          {/* Compact Shipping Fee Display */}
          <div className="flex items-center justify-between py-1 px-2 bg-orange-50 rounded-md">
            <span className="text-xs text-orange-700 font-medium">Shipping:</span>
            <div className="text-right">
              <div className="text-xs font-bold text-orange-800">
                <NumberFlow
                  value={(() => {
                    const currentItems = getCurrentCartItems();

                    // Determine shipping mode based on selected country view
                    let currentMode;
                    if (selectedCountryView === 'nigeria') {
                      currentMode = 'land';
                    } else if (selectedCountryView === 'china') {
                      currentMode = shippingMode;
                    } else if (selectedCountryView === 'all') {
                      // Mixed cart - calculate total for both countries
                      if (cartByCountry.nigeria.length > 0 && cartByCountry.china.length > 0) {
                        return calculateTotalShippingCost();
                      }
                      // Single country in "all" view
                      currentMode = cartByCountry.nigeria.length > 0 && cartByCountry.china.length === 0 ? 'land' : shippingMode;
                    }

                    return calculateShippingCost(currentItems, currentMode);
                  })()}
                  format={{
                    style: 'currency',
                    currency: import.meta.env.VITE_CURRENCY || 'XAF',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  }}
                />
              </div>
              <div className="text-xs text-orange-600">Pay on delivery</div>
            </div>
          </div>

          {/* Compact Checkout Button */}
          <button
            onClick={() => {
              // Store shipping info in localStorage for checkout
              const checkoutData = {
                shippingMode: (() => {
                  if (selectedCountryView === 'nigeria' || (cartByCountry.nigeria.length > 0 && cartByCountry.china.length === 0)) {
                    return 'land';
                  }
                  return shippingMode;
                })(),
                selectedCountry: (() => {
                  if (selectedCountryView === 'nigeria') return 'nigeria';
                  if (selectedCountryView === 'china') return 'china';
                  return cartByCountry.nigeria.length > 0 ? 'nigeria' : 'china';
                })(),
                cartItems: getCheckoutItems()
              };
              localStorage.setItem('checkoutData', JSON.stringify(checkoutData));

              if (token) {
                navigate('/place-order');
              } else {
                navigate('/login', { state: { from: '/cart' } });
              }
            }}
            disabled={hasStockError || (cartByCountry.nigeria.length > 0 && cartByCountry.china.length > 0 && selectedCountryView === 'all')}
            className={`w-full py-3 rounded-full font-semibold text-sm transition-all duration-300 shadow-lg ${
              hasStockError || (cartByCountry.nigeria.length > 0 && cartByCountry.china.length > 0 && selectedCountryView === 'all')
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-brand text-white hover:bg-brand-dark shadow-brand/20 hover:shadow-xl'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              {!hasStockError && !(cartByCountry.nigeria.length > 0 && cartByCountry.china.length > 0 && selectedCountryView === 'all') && (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5-6M20 13v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6m16 0V9a2 2 0 00-2-2H6a2 2 0 00-2 2v4.01" />
                </svg>
              )}
              <span>
                {hasStockError
                  ? 'Fix stock issues to continue'
                  : (cartByCountry.nigeria.length > 0 && cartByCountry.china.length > 0 && selectedCountryView === 'all')
                    ? 'Select country to continue'
                    : 'Proceed to Checkout'
                }
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}

export default Cart
