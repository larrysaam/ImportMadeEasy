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
      setActiveImage(selectedColor.colorImages[0]);
    } else if (productData?.image && productData.image.length > 0) {
      // Fallback to main product images if no color selected
      setActiveImage(productData.image[0]);
    }
    // Reset size when color changes
    setSelectedSize('');
  }, [selectedColor, productData]);

  // Get current images for gallery (color images or main images)
  const currentImages = useMemo(() => {
    if (selectedColor && selectedColor.colorImages && selectedColor.colorImages.length > 0) {
      return selectedColor.colorImages;
    }
    return productData?.image || [];
  }, [selectedColor, productData]);

  // Get current sizes for the selected color
  const currentSizes = useMemo(() => {
    if (selectedColor && selectedColor.sizes && selectedColor.sizes.length > 0) {
      return selectedColor.sizes;
    }
    return [];
  }, [selectedColor]);

  // Get available quantity for selected size
  const availableQuantity = useMemo(() => {
    if (!selectedSize || !selectedColor) return 0;
    const sizeObj = selectedColor.sizes?.find(s => s.size === selectedSize);
    return sizeObj?.quantity || 0;
  }, [selectedSize, selectedColor]);

  const handleColorSelect = (color) => {
    setSelectedColor(color);
    // Size will be reset by useEffect
  };

  const handleSizeSelect = (size) => {
    setSelectedSize(size);
  };

  const handlePreorder = async () => {
    if (!token) {
      navigate('/login')
      return
    }

    if (!selectedSize) {
      toast.error('Please select a size')
      return
    }

    if (!selectedColor) {
      toast.error('Please select a color')
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
        size: selectedSize,
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
    if (!selectedSize) {
      toast.error('Please select a size')
      return
    }
    if (!selectedColor) {
      toast.error('Please select a color')
      return
    }
    
    // Pass color hex code to cart
    addToCart(productData?._id, selectedSize, selectedColor?.colorHex);
    toast.success(`${productData?.name} (${selectedColor?.colorName}, ${selectedSize}) added to cart!`);
  }

  if (isLoading) {
    return <ProductSkeleton />
  }

  if (!foundProduct) {
    return (<NotFound />)
  }

  return (
    <div className='border-t-2 pt-6 sm:pt-10 animate-fade animate-duration-500 mx-2 sm:mx-4 md:mx-8 lg:mx-16 xl:mx-24'>
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
                    hover:opacity-80 hover:scale-105 ${activeImage === imgSrc ? 'border-2 border-black ring-2 ring-offset-1 ring-black' : 'border border-gray-200'}`}
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
            </div>
          </div>

          {/* ----------- Product Info ----------- */}
          <div className='flex-1 px-2 sm:px-0'>
            <div className="flex flex-col gap-2">
              <h1 className='font-medium text-xl sm:text-2xl mt-2'>{productData?.name}</h1>
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
            </div>
            <p className='mt-3 sm:mt-5 font-medium text-2xl sm:text-3xl text-brand'>{currency}{productData?.price}</p>
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
                      title={color.colorName}
                      onClick={() => handleColorSelect(color)}
                      className={`relative w-10 h-10 rounded-md border-none transition-all duration-200
                       
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
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size Selection */}
            {selectedColor && (
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
                <p className='text-gray-600 text-center'>Please select a color to see available sizes</p>
              </div>
            )}

           
            {/* Action Buttons */}
            <div className='w-full sm:w-auto fixed bottom-0 left-0 sm:relative p-4 sm:p-0 bg-white border-t sm:border-0 z-10'>
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
                    disabled={!selectedSize || !selectedColor || availableQuantity === 0}
                    className={`w-full sm:w-auto bg-brand text-white px-6 sm:px-8 py-3 text-sm rounded-full transition-all ${
                      (!selectedSize || !selectedColor || availableQuantity === 0) 
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
                  disabled={!selectedSize || !selectedColor || availableQuantity === 0}
                  className={`w-full sm:w-auto bg-brand text-white px-6 sm:px-8 py-3 text-sm rounded-full transition-all ${
                    !selectedSize || !selectedColor || availableQuantity === 0 
                      ? 'opacity-50 cursor-not-allowed' 
                      : 'hover:bg-brand-dark active:bg-brand-dark'
                  }`}
                >
                  {!selectedColor ? 'Select Color & Size' : !selectedSize ? 'Select Size' : 'Add to Cart'}
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
