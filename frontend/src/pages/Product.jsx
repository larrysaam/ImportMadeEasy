import React, { useContext, useEffect, useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { ShopContext } from '@/context/ShopContext'
import RelatedProducts from '@/features/product/RelatedProducts';
import { ProductSkeleton } from '@/components/ProductSkeleton';
import NotFound from '@/components/NotFound';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import axios from 'axios';
import { toast } from 'react-toastify';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import ReviewSection from '@/components/ReviewSection'
import PhotoUpload from '@/components/UserPhotos/PhotoUpload';
import ShareButton from '@/components/ShareButton';
import MetaTags from '@/components/MetaTags';

const Product = () => {

  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const { productId } = useParams();
  const { products, currency, addToCart, token, navigate, isLoading } = useContext(ShopContext)
  const [productData, setProductData] = useState(null)
  const [activeImage, setActiveImage] = useState('')
  const [selectedColor, setSelectedColor] = useState(null)
  const [selectedSize, setSelectedSize] = useState('')
  const [hasPreordered, setHasPreordered] = useState(false)
  const [address, setAddress] = useState({
    firstName: '',
    lastName: '',
    email: '',
    street: '',
    city: '',
    state: '',
    country: '',
    zipcode: '',
    phone: ''
  })
  const [addressDialogOpen, setAddressDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const foundProduct = products.find((item) => item._id == productId);

  useEffect(() => {
    setProductData(foundProduct);
    if (foundProduct) {
      // Set default color to first available color
      if (foundProduct.colors && foundProduct.colors.length > 0) {
        setSelectedColor(foundProduct.colors[0]);
      } else {
        setSelectedColor(null);
      }
      setSelectedSize(''); // Reset size when product changes
    }
  }, [foundProduct]);

  // Update active image when color changes
  useEffect(() => {
    if (selectedColor && selectedColor.colorImages && selectedColor.colorImages.length > 0) {
      // Set the active image to the first image of the selected color
      setActiveImage(selectedColor.colorImages[0]);
    } else if (productData?.image && productData.image.length > 0) {
      // Fallback to main product images if no color selected or color has no images
      setActiveImage(productData.image[0]);
    }
    // Reset size when color changes
    setSelectedSize('');
  }, [selectedColor, productData]);

  // Get current images for gallery (color images or main images)
  const currentImages = useMemo(() => {
    // If a color is selected and it has images, use those
    if (selectedColor && selectedColor.colorImages && selectedColor.colorImages.length > 0) {
      return selectedColor.colorImages;
    }
    // Otherwise fall back to the main product images
    return productData?.image || [];
  }, [selectedColor, productData]);

  // Add/remove class to body for product page styling
  useEffect(() => {
    document.body.classList.add('product-page')
    return () => {
      document.body.classList.remove('product-page')
    }
  }, [])

  // Get current sizes for the selected color, filtering out 'N/A' sizes
  const currentSizes = useMemo(() => {
    if (selectedColor && selectedColor.sizes && selectedColor.sizes.length > 0) {
      // Filter out 'N/A' sizes as these products don't have real sizes
      return selectedColor.sizes.filter(size => size.size !== 'N/A');
    }
    return [];
  }, [selectedColor]);

  // Check if this product has sizes or is a no-size product (uses N/A)
  const hasRealSizes = useMemo(() => {
    if (!selectedColor || !selectedColor.sizes || selectedColor.sizes.length === 0) {
      return false;
    }
    // If the only size is 'N/A', then this product doesn't have real sizes
    return !(selectedColor.sizes.length === 1 && selectedColor.sizes[0].size === 'N/A');
  }, [selectedColor]);

  // Get available quantity for selected size or N/A size for products without sizes
  const availableQuantity = useMemo(() => {
    if (!selectedColor) return 0;

    // For products without real sizes (only N/A), get quantity from N/A size
    if (!hasRealSizes) {
      const naSize = selectedColor.sizes?.find(s => s.size === 'N/A');
      return naSize?.quantity || 0;
    }

    // For products with real sizes, require a selected size
    if (!selectedSize) return 0;
    const sizeObj = selectedColor.sizes?.find(s => s.size === selectedSize);
    return sizeObj?.quantity || 0;
  }, [selectedSize, selectedColor, hasRealSizes]);

  const handleColorSelect = (color) => {
    setSelectedColor(color);
    // If the color has images, set the active image to the first one
    if (color.colorImages && color.colorImages.length > 0) {
      setActiveImage(color.colorImages[0]);
    }

    // For products without real sizes (only N/A), automatically set size to N/A
    if (color.sizes && color.sizes.length === 1 && color.sizes[0].size === 'N/A') {
      setSelectedSize('N/A');
    } else {
      // Reset size for products with real sizes
      setSelectedSize('');
    }
  };

  const handleSizeSelect = (size) => {
    setSelectedSize(size);
  };

  const handlePreorder = async () => {
    if (!token) {
      navigate('/login')
      return
    }

    if (!selectedColor) {
      toast.error('Please select a color')
      return
    }

    // Only check for size selection if the product has real sizes
    if (hasRealSizes && !selectedSize) {
      toast.error('Please select a size')
      return
    }

    setAddressDialogOpen(true)
  }

  const handlePreorderSubmit = async () => {
    try {
      if (!address.firstName || !address.lastName || !address.email || !address.phone || 
          !address.street || !address.city || !address.state || !address.country || !address.zipcode) {
        toast.error('Please fill all address fields')
        return
      }

      setIsSubmitting(true)

      const preorderItem = {
        productId: productData._id,
        name: productData.name,
        size: hasRealSizes ? selectedSize : 'N/A',
        quantity: 1,
        price: productData.price,
        image: activeImage,
        color: selectedColor?.colorName,
        colorHex: selectedColor?.colorHex
      };

      const response = await axios.post(`${backendUrl}/api/preorder/create`, {
        userId: token,
        items: [preorderItem],
        address
      }, {
        headers: { token }
      })

      if (response.data.success) {
        toast.success('Preorder placed successfully')
        setHasPreordered(true)
        setAddressDialogOpen(false)
        setAddress({
          firstName: '', lastName: '', email: '', street: '', city: '',
          state: '', country: '', zipcode: '', phone: ''
        })
      }
    } catch (error) {
      if (error.response?.status === 409) {
        toast.error('You have already preordered this item')
      } else {
        toast.error('Failed to place preorder')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddToCart = () => {
    if (!token) {
      navigate('/login')
      return
    }

    if (!selectedColor) {
      toast.error('Please select a color')
      return
    }

    // Only check for size selection if the product has real sizes
    if (hasRealSizes && !selectedSize) {
      toast.error('Please select a size')
      return
    }

    // Use 'N/A' for products without sizes, otherwise use selected size
    const sizeToAdd = hasRealSizes ? selectedSize : 'N/A';

    // Pass color hex code to cart
    addToCart(productData?._id, sizeToAdd, selectedColor?.colorHex);

    // Create appropriate success message
    const sizeText = hasRealSizes ? `, ${selectedSize}` : '';
    toast.success(`${productData?.name} (${selectedColor?.colorName}${sizeText}) added to cart!`);
  }

  if (isLoading) {
    return <ProductSkeleton />
  }

  if (!foundProduct) {
    return (<NotFound />)
  }

  return (
    <div className='border-t-2 pt-6 sm:pt-10 pb-20 sm:pb-6 animate-fade animate-duration-500 mx-2 sm:mx-4 md:mx-8 lg:mx-16 xl:mx-24'>
      {/* Meta Tags for Social Sharing */}
      <MetaTags
        product={productData}
        selectedColor={selectedColor}
        activeImage={activeImage}
        currency={currency}
      />

      <div>
        {/* ----------- Product Data ----------- */}
        <div className='flex gap-4 sm:gap-12 md:gap-20 flex-col sm:flex-row'>
          {/* ----------- Product Images ----------- */}
          <div className='flex-1 flex flex-col-reverse gap-2 sm:gap-3 sm:flex-row'>
            {/* Side thumbnails */}
            <div className='flex sm:flex-col overflow-x-auto sm:overflow-y-auto 
                gap-2 sm:gap-0 justify-start sm:justify-start w-full sm:w-[15%] sm:max-h-[500px] 
                scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent'>
              {currentImages.map((imgSrc, index) => (
                <img 
                  src={imgSrc} 
                  alt={`${selectedColor?.colorName || 'product'}-${index + 1}`} 
                  key={index} 
                  onClick={() => setActiveImage(imgSrc)}
                  className={`w-[20%] sm:w-full sm:h-[80px] object-cover mb-0 sm:mb-2 flex-shrink-0 
                    cursor-pointer rounded-md transition-all duration-200 
                    hover:opacity-80 hover:scale-105 ${activeImage === imgSrc ? 'border-2 border-brand ' : 'border border-gray-200'}`}
                />
              ))}
            </div>

            {/* Main image */}
            <div className='w-full sm:w-[85%] h-[300px] sm:h-[500px]'>
              <img 
                src={activeImage} 
                className='w-full h-full object-cover rounded-md' 
                alt={`${productData?.name} - ${selectedColor?.colorName || 'main'}`}
              />
              {/* Add a small indicator showing this is a color-specific image */}
              {selectedColor && selectedColor.colorImages && selectedColor.colorImages.includes(activeImage) && (
                <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: selectedColor.colorHex }}
                  ></div>
                  <span>Showing {selectedColor.colorName} color variant</span>
                </div>
              )}
            </div>
          </div>

          {/* ----------- Product Info ----------- */}
          <div className='flex-1 px-2 sm:px-0'>
            <div className="flex flex-col gap-2">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h1 className='font-medium text-xl sm:text-2xl mt-2'>{productData?.name}</h1>

                  {/* Product badges section */}
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    {/* Label badge */}
                    {productData?.label && productData.label !== '' && (
                      <span className={`
                        inline-block w-fit px-3 py-1 text-sm font-medium rounded-full
                        ${productData.label === 'New model'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-purple-100 text-purple-800'
                        }
                      `}>
                        {productData.label}
                      </span>
                    )}

                    {/* Country of Origin badge */}
                    {productData?.countryOfOrigin && (
                      <span className={`
                        inline-block w-fit px-3 py-1 text-sm font-medium rounded-full
                        ${productData.countryOfOrigin === 'Nigeria'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                        }
                      `}>
                        Made in {productData.countryOfOrigin}
                      </span>
                    )}

                    {/* Product Type badge */}
                    {/* {productData?.productType && (
                      <span className={`
                        inline-block w-fit px-3 py-1 text-sm font-medium rounded-full
                        ${productData.productType === 'Express'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-gray-100 text-gray-800'
                        }
                      `}>
                        {productData.productType}
                      </span>
                    )} */}
                  </div>
                </div>

                {/* Share Button */}
                <div className="flex-shrink-0 mt-2">
                  <ShareButton
                    product={productData}
                    selectedColor={selectedColor}
                    activeImage={activeImage}
                    currency={currency}
                  />
                </div>
              </div>
            </div>
            <p className='mt-3 sm:mt-5 font-medium text-2xl sm:text-3xl text-brand'>{currency} {productData?.price?.toLocaleString('fr-CM')}</p>
            <p className='mt-3 sm:mt-5 text-gray-500 text-sm sm:text-base'>{productData?.description}</p>
            
            {/* Color Selection */}
            {productData?.colors && productData.colors.length > 0 && (
              <div className='my-6 sm:my-8'>
                <p className='mb-3 font-medium'>
                  Color: {selectedColor ? (
                    <span className='font-normal text-gray-600'>{selectedColor.colorName}</span>
                  ) : (
                    <span className='font-normal text-gray-400'>Please select a color</span>
                  )}
                </p>
                <div className="flex flex-wrap gap-3">
                  {productData.colors.map((color, index) => (
                    <button
                      key={index}
                      title={`${color.colorName}${color.colorImages && color.colorImages.length > 0 ? ' (has custom images)' : ''}`}
                      onClick={() => handleColorSelect(color)}
                      className={`relative w-10 h-10 rounded-md border-none transition-all duration-200
                        ${color.colorImages && color.colorImages.length > 0 ? 'ring-1 ring-gray-300' : ''}
                        hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black`}
                      style={{ backgroundColor: color.colorHex }}
                    >
                      {selectedColor?.colorName === color.colorName && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg className="w-4 h-4 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                      {/* Small indicator for colors with images */}
                      {color.colorImages && color.colorImages.length > 0 && (
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size Selection - Only show for products with real sizes */}
            {selectedColor && hasRealSizes && (
              <div className='my-6 sm:my-8'>
                <p className='mb-3 font-medium'>
                  Size: {selectedSize ? (
                    <span className='font-normal text-gray-600'>{selectedSize}</span>
                  ) : (
                    <span className='font-normal text-gray-400'>Please select a size</span>
                  )}
                </p>
                {/* <p className='text-xs text-gray-500 mb-3'>
                  <span className='underline cursor-pointer'>Size Guide</span>
                </p> */}
                {currentSizes.length > 0 ? (
                  <ToggleGroup className='flex flex-wrap justify-start gap-2' type="single">
                    {currentSizes.map((sizeObj) => (
                      <ToggleGroupItem
                        key={sizeObj.size}
                        value={sizeObj.size}
                        disabled={sizeObj.quantity === 0}
                        className={`text-sm sm:text-base px-3 py-2 sm:px-4 sm:py-3 transition-all duration-200 border rounded-md
                          ${sizeObj.quantity === 0
                            ? 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-400'
                            : selectedSize === sizeObj.size
                              ? 'bg-white text-black border-brand border-2'
                              : 'bg-white text-black border-gray-300 hover:border-brand hover:bg-gray-50'
                          }`}
                        onClick={() => sizeObj.quantity > 0 && handleSizeSelect(sizeObj.size)}
                      >
                        <div className="flex flex-col items-center">
                          <span>{sizeObj.size}</span>
                          {sizeObj.quantity === 0 && (
                            <span className="text-xs">Out of Stock</span>
                          )}
                        </div>
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                ) : (
                  <p className="text-gray-500 text-sm">No sizes available for this color</p>
                )}

                {/* Stock indicator */}
                {/* {selectedSize && availableQuantity > 0 && (
                  <p className="text-sm text-green-600">
                    {availableQuantity} {availableQuantity === 1 ? 'item' : 'items'} in stock
                  </p>
                )} */}
              </div>
            )}

            {/* Selection prompt when no color is selected */}
            {!selectedColor && productData?.colors && productData.colors.length > 0 && (
              <div className='my-6 sm:my-8 p-4 bg-gray-50 rounded-md'>
                <p className='text-gray-600 text-center'>
                  {hasRealSizes ? 'Please select a color to see available sizes' : 'Please select a color'}
                </p>
              </div>
            )}

            {/* Delivery Information */}
            <div className='my-6 sm:my-8 p-4 bg-gray-50 rounded-md'>
              <h3 className='font-medium mb-2'>Delivery Information</h3>
              <div className='flex flex-col gap-2 text-sm'>
                <div className='flex justify-between'>
                  <p>Shipping Fee:</p>
                  <p className='font-medium'>{currency}900</p>
                </div>
                <div className='flex justify-between'>
                  <p>Estimated Delivery Time:</p>
                  <p className='font-medium'>9 days</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className='w-full sm:w-auto fixed bottom-0 left-0 sm:relative p-4 sm:p-0 bg-white border-t sm:border-0 z-10 shadow-lg sm:shadow-none'>
              {productData?.preorder ? (
                hasPreordered ? (
                  <button 
                    disabled
                    className='w-full sm:w-auto bg-gray-400 text-white px-6 sm:px-8 py-3 text-sm rounded-full cursor-not-allowed'
                  >
                    Preordered
                  </button>
                ) : (
                  <button
                    onClick={handlePreorder}
                    disabled={!selectedColor || availableQuantity === 0 || (hasRealSizes && !selectedSize)}
                    className={`w-full sm:w-auto bg-brand text-white px-6 sm:px-8 py-3 text-sm rounded-full transition-all ${
                      (!selectedColor || availableQuantity === 0 || (hasRealSizes && !selectedSize))
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:bg-brand-dark active:bg-brand-dark'
                    }`}
                  >
                    Preorder Now
                  </button>
                )
              ) : (
                <button
                  onClick={handleAddToCart}
                  disabled={!selectedColor || availableQuantity === 0 || (hasRealSizes && !selectedSize)}
                  className={`w-full sm:w-auto bg-brand text-white px-6 sm:px-8 py-3 text-sm rounded-full transition-all ${
                    !selectedColor || availableQuantity === 0 || (hasRealSizes && !selectedSize)
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-brand-dark active:bg-brand-dark'
                  }`}
                >
                  {!selectedColor ? (hasRealSizes ? 'Select Color & Size' : 'Select Color') : (hasRealSizes && !selectedSize) ? 'Select Size' : 'Add to Cart'}
                </button>
              )}
            </div>

             {/* ----------- Review Section ----------- */}
            <div className="my-6 sm:my-8">
              <ReviewSection productId={productId} />
            </div>

          </div>
        </div>

        {/* ----------- User Photos Section ----------- */}
        <div className="mt-12 sm:mt-20 border-t pt-6 sm:pt-10">
          <h2 className="text-xl sm:text-2xl font-medium mb-4 sm:mb-6">How Others Are Wearing It</h2>
          <p className="text-sm sm:text-base text-gray-500 mb-4">
            Upload your photo or mention @OurBrand on Instagram for a chance to be featured.
          </p>
          
          <PhotoUpload productId={productId} onPhotoAdded={() => {
            // Refresh photos
          }} />

          {/* Photo Gallery - Horizontal Scroll */}
          <div className="mt-6 sm:mt-8 relative">
            <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent snap-x snap-mandatory">
              {productData?.userPhotos?.map((photo, index) => (
                <div 
                  key={index} 
                  className="flex-none w-[250px] sm:w-[300px] aspect-square rounded-lg overflow-hidden snap-center"
                >
                  <img 
                    src={photo.imageUrl}
                    alt={`User photo ${index + 1}`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* -----------Description and Tabs Section -----------*/}
        {/* <div className='mt-20'>
          <Tabs defaultValue="description" className="">
            <TabsList className='bg-white border text-sm h-12 p-[0.5px]'>
              <TabsTrigger className='px-4 py-3 data-[state=active]:border data-[state=active]:font-semibold'
                value="description">
                  Description</TabsTrigger>
                  <TabsTrigger className='px-4 py-3 data-[state=active]:border data-[state=active]:font-semibold'
              value="specs">
                Specifications</TabsTrigger>
            </TabsList>
            <div className='text-gray-700 text-base mt-2'>
              <TabsContent
              className='p-4 mt-0 border'
              value="description">
                <div>
                This premium cotton t-shirt offers ultimate comfort and durability. Designed for everyday wear, it features a breathable fabric and a modern fit. Available in multiple colors to match any style.
                </div>
                <div className='mt-2'>
                Embrace timeless fashion with our Classic Relaxed-Fit Jacket—a versatile wardrobe staple that blends comfort with effortless style. Designed for everyday wear, this jacket offers a relaxed fit with a modern edge, perfect for layering in any season.
                </div>
              </TabsContent>
              <TabsContent 
              className='p-4 mt-0 border'
              value="specs">
                <ul>
                  <li><b>Material: </b>{`100% Organic Cotton`}</li>
                  <li><b>Fit: </b>{`Regular / Slim`}</li>
                  <li><b>Care Instructions: </b>{`Machine wash cold, tumble dry low`}</li>
                  <li><b>Country of Origin: </b>{`Italy`}</li>
                </ul>
              </TabsContent>
            </div>
          </Tabs>

        </div> */}
        
        {/*  ----------- Related Products -----------*/}
        <RelatedProducts category={productData?.category || ''} subcategory={productData?.subcategory || ''} id={productId} />
      </div>

      {/* ----------- Address Dialog ----------- */}
      <Dialog open={addressDialogOpen} onOpenChange={setAddressDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Shipping Address</DialogTitle>
            <DialogDescription>
              Please enter your shipping details to complete the preorder.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Input
                  placeholder="First Name"
                  value={address.firstName}
                  onChange={(e) => setAddress({...address, firstName: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Input
                  placeholder="Last Name"
                  value={address.lastName}
                  onChange={(e) => setAddress({...address, lastName: e.target.value})}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Input
                type="email"
                placeholder="Email"
                value={address.email}
                onChange={(e) => setAddress({...address, email: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Input
                type="tel"
                placeholder="Phone Number"
                value={address.phone}
                onChange={(e) => setAddress({...address, phone: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Input
                placeholder="Street Address"
                value={address.street}
                onChange={(e) => setAddress({...address, street: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                placeholder="City"
                value={address.city}
                onChange={(e) => setAddress({...address, city: e.target.value})}
              />
              <Input
                placeholder="State"
                value={address.state}
                onChange={(e) => setAddress({...address, state: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                placeholder="Country"
                value={address.country}
                onChange={(e) => setAddress({...address, country: e.target.value})}
              />
              <Input
                placeholder="Zipcode"
                value={address.zipcode}
                onChange={(e) => setAddress({...address, zipcode: e.target.value})}
              />
            </div>
          </div>
          <div className="flex justify-end gap-4">
            <button
              onClick={() => setAddressDialogOpen(false)}
              disabled={isSubmitting}
              className={`px-4 py-2 text-sm border rounded-full transition-colors
                ${isSubmitting 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:bg-gray-100'
                }`}
            >
              Cancel
            </button>
            <button
              onClick={handlePreorderSubmit}
              disabled={isSubmitting}
              className={`px-4 py-2 text-sm bg-blue-600 text-white rounded-full transition-colors
                ${isSubmitting 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:bg-blue-700'
                }`}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Processing...
                </span>
              ) : (
                'Confirm Preorder'
              )}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      
    </div>
  )
}

export default Product
