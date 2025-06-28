import React, { useEffect, useRef, useState, useCallback } from 'react'
import axios from 'axios'
import { backendUrl } from '../App'
import { toast } from "sonner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import * as z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm, useFieldArray } from "react-hook-form"
import { useParams, useNavigate } from "react-router-dom"
import { is } from 'date-fns/locale'

const CLOTHING_SIZES = ['S', 'M', 'L', 'XL', '2XL', '3XL', '4XL']
const SHOE_SIZES = Array.from({ length: 23 }, (_, i) => (i + 26).toString())
const KIDS_SHOE_SIZES = Array.from({ length: 13 }, (_, i) => (i + 26).toString())

// Custom File Upload Component
const FileUpload = ({ value = [], onChange, maxFiles = 4, label = "Upload Images" }) => {
  const fileInputRef = useRef(null)
  const [previews, setPreviews] = useState([])
  const uniqueId = useRef(`file-upload-${Math.random().toString(36).substr(2, 9)}`).current;

  useEffect(() => {
    if (value && value.length > 0) {
      const newPreviews = value.map(file => {
        if (file instanceof File) {
          return {
            file,
            url: URL.createObjectURL(file),
            name: file.name
          }
        } else if (typeof file === 'string') { // Handle existing image URLs
          return {
            file: null, // No actual file object for existing URLs
            url: file,  // The URL itself
            name: file.substring(file.lastIndexOf('/') + 1) // Extract filename
          };
        }
        return null
      }).filter(Boolean)
      setPreviews(newPreviews)
    } else {
      setPreviews([])
      if (fileInputRef.current) fileInputRef.current.value = ''; // Clear file input if value is empty
    }
  }, [value])

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files)
    if (files.length > maxFiles) {
      toast.warning(`Maximum ${maxFiles} images allowed`)
      return
    }
    onChange(files) // This passes File objects, effectively replacing any existing URLs in 'value'
  }

  const removeFile = (index) => {
    const newFiles = value.filter((_, i) => i !== index)
    onChange(newFiles)
  }

  const clearAll = () => {
    onChange([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="w-full max-w-[500px]">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-gray-400 transition-colors">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          id={uniqueId}
        />
        <label
          htmlFor={uniqueId}
          className="cursor-pointer flex flex-col items-center justify-center py-4"
        >
          <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <span className="text-sm text-gray-600">{label}</span>
          <span className="text-xs text-gray-400 mt-1">Max {maxFiles} files</span>
        </label>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileChange}
          className="w-full mt-2 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>

      {previews.length > 0 && (
        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Selected Images ({previews.length}/{maxFiles})</span>
            <button
              type="button"
              onClick={clearAll}
              className="text-xs text-red-600 hover:text-red-800"
            >
              Clear All
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {previews.map((preview, index) => (
              <div key={index} className="relative group">
                <img
                  src={preview.url}
                  alt={preview.name}
                  className="w-full h-20 object-cover rounded border"
                />
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ×
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 truncate">
                  {preview.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const Add = ({token}) => {
  const [availableSubcategories, setAvailableSubcategories] = useState([])
  const [availableSubSubcategories, setAvailableSubSubcategories] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingProduct, setIsLoadingProduct] = useState(false)
  const [categories, setCategories] = useState({})

  const { productId } = useParams()
  const navigate = useNavigate()
  const isEditMode = !!productId
  const [productToEdit, setProductToEdit] = useState(null)

  const colorVariantSchema = z.object({
    colorName: z.string().min(1, "Color name is required"),
    colorHex: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid hex color"),
    colorImages: z.array(z.any())
      .min(1, "At least one image is required")
      .max(4, "Maximum 4 images allowed per color"),
    // Make sizes optional - can be empty array for products without sizes
    sizes: z.array(z.object({
      size: z.string().min(1, "Size is required"),
      quantity: z.number().min(0, "Quantity cannot be negative")
    })).optional().default([]),
    // Add direct quantity field for products without sizes
    quantity: z.number().min(0, "Quantity cannot be negative").optional().default(0)
  })

  const validationSchema = z.object({
    images: z.array(z.any())
      .min(1, "Please select at least one file")
      .max(4, "Maximum 4 images allowed"),
    name: z.string().min(2, {message: "Enter product name"}),
    description: z.string().min(2, {message: "Description is required"}),
    price: z.coerce.number().positive({message : "Please enter product price"}),
    category: z.string().min(1, {message: "Category is required"}),
    subcategory: z.string().optional(), // Made optional
    subsubcategory: z.string().optional(), // Made optional
    bestseller: z.boolean(),
    preorder: z.boolean(),
    label: z.string(),
    sizeType: z.string(),
    hasSizes: z.boolean(),
    keywords: z.string().optional(),
    countryOfOrigin: z.enum(['Nigeria', 'China'], {message: "Please select country of origin"}),
    deliveryMethod: z.enum(['Standard', 'Express', 'Premium'], {message: "Please select delivery method"}),
    productType: z.enum(['Express', 'Normal'], {message: "Please select product type"}),
    colors: z.array(colorVariantSchema)
      .min(1, "At least one color variant is required"),
  })

  const { control, handleSubmit, reset, watch, setValue, formState: { errors, isDirty } } = useForm({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      images: [],
      name: "",
      description: "",
      price: "",
      category: "",
      subcategory: "",
      subsubcategory: "",
      bestseller: false,
      preorder: false,
      label: "",
      sizeType: 'clothing',
      hasSizes: true, // New field to control if product has sizes
      keywords: "",
      countryOfOrigin: "Nigeria",
      deliveryMethod: "Standard",
      productType: "Normal",
      colors: [],
    },
  })
  
  useEffect(()=>{
    console.log(token)
  },[])
  
  // Add this line to check if all category fields are selected
  const canAddColors = Boolean(
    watch('category')
  )

  // Add useFieldArray hook for colors
  const { fields, append, remove } = useFieldArray({
    control,
    name: "colors"
  })

  const onSubmit = async (values) => {
    setIsSubmitting(true)
    try {
      const formData = new FormData()

      // Add basic product info
      Object.keys(values).forEach(key => {
        if (!['images', 'colors'].includes(key)) {
          let value = values[key]
          // Convert empty strings to null for optional category fields
          if ((key === 'subcategory' || key === 'subsubcategory') && (!value || value.trim() === '')) {
            value = null
          }
          // Convert "none" to empty string for label field to match backend enum
          if (key === 'label' && value === 'none') {
            value = ''
          }
          formData.append(key, value)
        }
      })

      // Handle main product images
      // Only append new File objects
      if (values.images && values.images.length > 0) {
        values.images.forEach((file) => {
          if (file instanceof File) {
            formData.append('image', file)
          }
        });
      }

      // Handle color variants data (excluding images)
      const colorsData = values.colors.map(color => {
        // For products without sizes, create a single 'N/A' size entry with the quantity
        if (!values.hasSizes) {
          return {
            colorName: color.colorName,
            colorHex: color.colorHex,
            sizes: [{
              size: 'N/A',
              quantity: color.quantity || 0
            }]
          }
        }
        // For products with sizes, use the existing sizes array
        return {
          colorName: color.colorName,
          colorHex: color.colorHex,
          sizes: color.sizes || []
        }
      })
      formData.append('colors', JSON.stringify(colorsData))

      // Handle color images - append each color's images with color index
      // Only append new File objects
      values.colors.forEach((color, colorIndex) => {
        if (color.colorImages && color.colorImages.length > 0) {
          color.colorImages.forEach((file) => {
            if (file instanceof File) {
              formData.append(`colorImages_${colorIndex}`, file)
            }
          })
        }
      })

      let response;
      if (isEditMode) {
        response = await axios.put(`${backendUrl}/api/product/update/${productId}`, formData, {
          headers: { token, 'Content-Type': 'multipart/form-data' }
        });
      } else {
        response = await axios.post(`${backendUrl}/api/product/add`, formData, {
          headers: { token, 'Content-Type': 'multipart/form-data' }
        });
      }

      console.log('API Response:', response);
      console.log('Response data:', response?.data);
      console.log('Success flag:', response?.data?.success);

      if (response?.data?.success) {
        console.log('SUCCESS: Entering success block');
        toast.success(isEditMode ? 'Product updated successfully!' : 'Product added successfully!')

        try {
          if (!isEditMode) {
            console.log('SUCCESS: Resetting form for new product');

            // Clear color variants first
            try {
              console.log('SUCCESS: Clearing color variants, current count:', fields.length);
              // Use a safer approach to clear all fields
              const fieldsCount = fields.length;
              for (let i = fieldsCount - 1; i >= 0; i--) {
                console.log(`Removing field at index ${i}`);
                remove(i);
              }
              console.log('SUCCESS: Color variants cleared');
            } catch (colorError) {
              console.error('Error clearing color variants:', colorError);
            }

            // Reset form with default values
            try {
              console.log('SUCCESS: Resetting form fields');
              reset({
                images: [],
                name: "",
                description: "",
                price: "",
                category: "",
                subcategory: "",
                subsubcategory: "",
                bestseller: false,
                preorder: false,
                label: "none",
                sizeType: 'clothing',
                hasSizes: true,
                colors: [],
              });
              console.log('SUCCESS: Form reset completed');
            } catch (resetError) {
              console.error('Error resetting form:', resetError);
            }

          } else {
            console.log('SUCCESS: Navigating to list for edit mode');
            // Navigate back to list after editing
            navigate('/list')
          }
        } catch (resetError) {
          console.error('Error during form reset:', resetError)
          // Don't throw the error, just log it so the finally block executes
        }
      } else {
        console.log('ERROR: API returned success: false');
        console.log('Response data:', response?.data);
        // Handle case where API call succeeded but returned success: false
        const errorMessage = response?.data?.message || `Failed to ${isEditMode ? 'update' : 'add'} product`
        toast.error(errorMessage)
      }
    } catch (error) {
      console.log('CATCH: Error caught in onSubmit');
      console.error(`Error ${isEditMode ? 'updating' : 'adding'} product:`, error)
      console.log('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      toast.error(error.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'add'} product`)
    } finally {
      console.log('FINALLY: Setting isSubmitting to false');
      setIsSubmitting(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/categories`, {
        headers: { token }
      })
      if (response.data.success) {
        // Convert array to object with names as keys
        const categoriesObj = response.data.categories.reduce((acc, cat) => {
          acc[cat.name] = {
            ...cat,
            subcategories: cat.subcategories || []
          }
          return acc
        }, {})
        setCategories(categoriesObj)
      }
    } catch (error) {
      toast.error('Failed to fetch categories')
      console.error(error)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    if (isEditMode && productId) {
      setIsLoadingProduct(true);
      const fetchProductDetails = async () => {
        try {
          const response = await axios.get(`${backendUrl}/api/product/single/${productId}`, { headers: { token } });
          if (response.data.success) {
            const productData = response.data.product;
            setProductToEdit(productData); // Store for reference if needed

            // Clear existing colors first before populating
            while (fields.length > 0) {
              remove(0);
            }

            reset({
              images: productData.image || [], // Pass URLs
              name: productData.name,
              description: productData.description,
              price: productData.price,
              category: productData.category,
              subcategory: productData.subcategory || "", // Convert null to empty string for form
              subsubcategory: productData.subsubcategory || "", // Convert null to empty string for form
              bestseller: productData.bestseller,
              preorder: productData.preorder,
              label: productData.label === '' || !productData.label ? "none" : productData.label,
              sizeType: productData.sizeType || 'clothing',
              hasSizes: productData.hasSizes !== false, // Default to true if not specified
              keywords: Array.isArray(productData.keywords) ? productData.keywords.join(', ') : (productData.keywords || ""),
              countryOfOrigin: productData.countryOfOrigin || "Nigeria",
              deliveryMethod: productData.deliveryMethod || "Standard",
              productType: productData.productType || "Normal",
              colors: [], // Will be populated by append below
            });

            // Populate color variants
            productData.colors.forEach(color => {
              // Check if this product has sizes or uses 'N/A' for no-size products
              const hasRealSizes = color.sizes && color.sizes.length > 0 && color.sizes[0].size !== 'N/A';

              append({
                colorName: color.colorName,
                colorHex: color.colorHex,
                colorImages: color.colorImages || [], // Pass URLs
                sizes: hasRealSizes ? color.sizes?.map(s => ({ size: s.size, quantity: s.quantity })) || [] : [],
                quantity: hasRealSizes ? 0 : (color.sizes?.[0]?.quantity || 0) // Extract quantity from 'N/A' size if no real sizes
              });
            });
          } else {
            toast.error("Failed to fetch product details for editing.");
          }
        } catch (error) {
          toast.error("Error fetching product details.");
        } finally {
          setIsLoadingProduct(false);
        }
      };
      fetchProductDetails();
    }
  }, [isEditMode, productId, backendUrl, token, reset, append, remove]);

  const fetchSubcategories = async (selectedCategory) => {
    if (categories[selectedCategory]) {
      setAvailableSubcategories(
        categories[selectedCategory].subcategories.map(sub => sub.name)
      )
    }
  }

  const fetchSubSubcategories = async (category, subcategory) => {
    if (categories[category]) {
      const subCat = categories[category].subcategories
        .find(sub => sub.name === subcategory)
      if (subCat) {
        setAvailableSubSubcategories(subCat.subcategories)
      }
    }
  }

  useEffect(() => {
    const selectedCategory = watch('category')
    if (selectedCategory) {
      fetchSubcategories(selectedCategory)
    }
  }, [watch('category'), categories])

  useEffect(() => {
    const category = watch('category')
    const subcategory = watch('subcategory')
    if (category && subcategory) {
      fetchSubSubcategories(category, subcategory)
    }
  }, [watch('category'), watch('subcategory'), categories])

  const getSizeOptions = useCallback(() => {
    const category = watch('category')
    const sizeType = watch('sizeType')

    if (sizeType === 'shoes') {
      return category === 'Kids' ? KIDS_SHOE_SIZES : SHOE_SIZES
    }
    return CLOTHING_SIZES
  }, [watch('category'), watch('sizeType')])

  const ColorVariant = ({ index, control, remove, watch, getSizeOptions }) => {
    const hasSizes = watch('hasSizes')

    return (
      <div className="border rounded-lg p-4 mb-4 bg-gray-50">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-medium">Color Variant {index + 1}</h3>
          <button
            type="button"
            onClick={() => remove(index)}
            className="text-red-500 hover:text-red-700 px-3 py-1 rounded border border-red-300 hover:bg-red-50"
          >
            Remove Color
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block mb-2 font-medium">Color Name</label>
            <Controller
              name={`colors.${index}.colorName`}
              control={control}
              render={({ field, fieldState: { error } }) => (
                <>
                  <Input {...field} placeholder="e.g., Navy Blue" />
                  {error && <p className="text-red-500 text-sm mt-1">{error.message}</p>}
                </>
              )}
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">Color</label>
            <Controller
              name={`colors.${index}.colorHex`}
              control={control}
              render={({ field, fieldState: { error } }) => (
                <>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={field.value || '#000000'}
                      onChange={(e) => field.onChange(e.target.value)}
                      className="h-[42px] w-[100px] rounded border"
                    />
                    <Input
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value)}
                      placeholder="#000000"
                      className="flex-1"
                    />
                  </div>
                  {error && <p className="text-red-500 text-sm mt-1">{error.message}</p>}
                </>
              )}
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block mb-2 font-medium">Color Images (Max 4)</label>
          <Controller
            name={`colors.${index}.colorImages`}
            control={control}
            render={({ field, fieldState: { error } }) => (
              <>
                <FileUpload
                  value={field.value || []}
                  onChange={field.onChange}
                  maxFiles={4}
                  label={`Upload images for ${watch(`colors.${index}.colorName`) || 'this color'}`}
                />
                {error && (
                  <p className="text-red-500 text-sm mt-1">{error.message}</p>
                )}
              </>
            )}
          />
        </div>

        {hasSizes ? (
          <div className="sizes-section mt-4">
            <p className="font-medium mb-4">Sizes and Quantities</p>
            <Controller
              name={`colors.${index}.sizes`}
              control={control}
              render={({ field, fieldState: { error } }) => (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {getSizeOptions().map((size) => (
                      <div key={size} className="flex flex-col gap-2 p-3 border rounded-md">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{size}</span>
                          <Checkbox
                            checked={field.value?.some(s => s.size === size) || false}
                            onCheckedChange={(checked) => {
                              const currentSizes = field.value || []
                              const newSizes = checked
                                ? [...currentSizes, { size, quantity: 0 }]
                                : currentSizes.filter(s => s.size !== size)
                              field.onChange(newSizes)
                            }}
                          />
                        </div>
                        {field.value?.some(s => s.size === size) && (
                          <Input
                            type="number"
                            min="0"
                            placeholder="Qty"
                            className="w-full"
                            value={field.value.find(s => s.size === size)?.quantity || 0}
                            onChange={(e) => {
                              const quantity = parseInt(e.target.value) || 0
                              const newSizes = field.value.map(s =>
                                s.size === size ? { ...s, quantity } : s
                              )
                              field.onChange(newSizes)
                            }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                  {error && <p className="text-red-500 text-sm mt-1">{error.message}</p>}
                </>
              )}
            />
          </div>
        ) : (
          <div className="quantity-section mt-4">
            <p className="font-medium mb-4">Quantity</p>
            <Controller
              name={`colors.${index}.quantity`}
              control={control}
              render={({ field, fieldState: { error } }) => (
                <>
                  <Input
                    type="number"
                    min="0"
                    placeholder="Enter quantity"
                    className="w-full max-w-[200px]"
                    value={field.value || 0}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                  {error && <p className="text-red-500 text-sm mt-1">{error.message}</p>}
                </>
              )}
            />
          </div>
        )}
      </div>
    )
  }

  if (isLoadingProduct) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
        <p className="ml-4 text-lg">Loading product details...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className='flex flex-col w-full items-start gap-3 pb-10'>
      <div className='w-full'>
        <p className='mb-2'>Upload up to 4 main product images</p>
        <div className='flex flex-col gap-2'>
          <Controller
            name="images"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <>
                <FileUpload
                  value={field.value || []}
                  onChange={field.onChange}
                  maxFiles={4}
                  label="Upload main product images"
                />
                {error && <p className="text-red-500 text-sm mt-1">{error.message}</p>}
              </>
            )}
          />
        </div>
      </div>

      <div className='w-full '>
        <p className='mb-2'>Product name</p>
        <Controller
          name="name"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <>
              <Input 
                {...field} 
                type="text"
                placeholder="Enter product name" 
                className='w-full px-3 py-2 max-w-[500px]'
              />
              {error && <p className="text-red-500 text-sm mt-1">{error.message}</p>}
            </>
          )}
        />
      </div>

      <div className='w-full '>
        <p className='mb-2'>Product description</p>
        <Controller
          name="description"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <>
              <Textarea 
                {...field} 
                placeholder='Enter description'
                className='w-full max-w-[500px] px-3 py-2'
              />
              {error && <p className="text-red-500 text-sm mt-1">{error.message}</p>}
            </>
          )}
        />
      </div>

      <div className='flex flex-col sm:flex-row gap-2 w-full sm:gap-8'>

        <div>
          <p className='mb-2'>Product category</p>
          <Controller
            name="category"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <>
                <Select 
                  value={field.value || ""}
                  onValueChange={(value) => {
                    field.onChange(value)
                    // Reset subcategory when category changes
                    reset({ ...watch(), subcategory: '', subsubcategory: '' })
                    // Fetch subcategories for selected category
                    fetchSubcategories(value)
                  }}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Choose..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(categories).map((categoryName) => (
                      <SelectItem key={categoryName} value={categoryName}>
                        {categoryName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {error && <p className="text-red-500 text-sm mt-1">{error.message}</p>}
              </>
            )}
          />
        </div>

        <div>
          <p className='mb-2'>Subcategory <span className="text-gray-500 text-sm">(Optional)</span></p>
          <Controller
            name="subcategory"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <>
                <Select
                  value={field.value || "none"}
                  onValueChange={(value) => {
                    // Convert "none" back to empty string for form state
                    const actualValue = value === "none" ? "" : value
                    field.onChange(actualValue)
                    reset({ ...watch(), subsubcategory: '' })
                    const category = watch('category')
                    if (category && actualValue) {
                      fetchSubSubcategories(category, actualValue)
                    }
                  }}
                  disabled={!watch('category') || availableSubcategories.length === 0}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Optional..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {availableSubcategories.map((subcategory) => (
                      <SelectItem key={subcategory} value={subcategory}>
                        {subcategory}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {error && <p className="text-red-500 text-sm mt-1">{error.message}</p>}
              </>
            )}
          />
        </div>

        <div>
          <p className='mb-2'>Second Level Category <span className="text-gray-500 text-sm">(Optional)</span></p>
          <Controller
            name="subsubcategory"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <>
                <Select
                  value={field.value || "none"}
                  onValueChange={(value) => {
                    // Convert "none" back to empty string for form state
                    const actualValue = value === "none" ? "" : value
                    field.onChange(actualValue)
                  }}
                  disabled={!watch('subcategory') || availableSubSubcategories.length === 0}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Optional..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {availableSubSubcategories.map((subsubcategory) => (
                      <SelectItem key={subsubcategory.name} value={subsubcategory.name}>
                        {subsubcategory.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {error && <p className="text-red-500 text-sm mt-1">{error.message}</p>}
              </>
            )}
          />
        </div>

        <div>
          <p className='mb-2'>Product price</p> 
          <Controller
            name="price"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <>
                <Input 
                  type="number"
                  placeholder="0" 
                  className='w-full px-3 py-2 sm:w-[120px]'
                  value={field.value || ''}
                  onChange={(e) => field.onChange(e.target.value)}
                />
                {error && <p className="text-red-500 text-sm mt-1">{error.message}</p>}
              </>
            )}
          />
        </div>
      </div>

      {/* New Fields Section */}
      <div className='flex flex-col sm:flex-row gap-4 w-full sm:gap-8 mb-4'>
        <div>
          <p className='mb-2'>Keywords <span className="text-gray-500 text-sm">(comma separated)</span></p>
          <Controller
            name="keywords"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <>
                <Input
                  {...field}
                  type="text"
                  placeholder="e.g. fashion, trendy, summer"
                  className='w-full px-3 py-2 max-w-[300px]'
                />
                {error && <p className="text-red-500 text-sm mt-1">{error.message}</p>}
              </>
            )}
          />
        </div>

        <div>
          <p className='mb-2'>Country of Origin</p>
          <Controller
            name="countryOfOrigin"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <>
                <Select
                  value={field.value || "Nigeria"}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Nigeria">Nigeria</SelectItem>
                    <SelectItem value="China">China</SelectItem>
                  </SelectContent>
                </Select>
                {error && <p className="text-red-500 text-sm mt-1">{error.message}</p>}
              </>
            )}
          />
        </div>
      </div>

      <div className='flex flex-col sm:flex-row gap-4 w-full sm:gap-8 mb-4'>
        <div>
          <p className='mb-2'>Delivery Method</p>
          <Controller
            name="deliveryMethod"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <>
                <Select
                  value={field.value || "Standard"}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Standard">Standard</SelectItem>
                    <SelectItem value="Express">Express</SelectItem>
                    <SelectItem value="Premium">Premium</SelectItem>
                  </SelectContent>
                </Select>
                {error && <p className="text-red-500 text-sm mt-1">{error.message}</p>}
              </>
            )}
          />
        </div>

        <div>
          <p className='mb-2'>Product Type</p>
          <Controller
            name="productType"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <>
                <Select
                  value={field.value || "Normal"}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Normal">Normal</SelectItem>
                    <SelectItem value="Express">Express</SelectItem>
                  </SelectContent>
                </Select>
                {error && <p className="text-red-500 text-sm mt-1">{error.message}</p>}
              </>
            )}
          />
        </div>
      </div>

      <div className="mb-4">
        <div className='flex items-center gap-2 mb-4'>
          <label
            htmlFor="hasSizes"
            className="cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Product has sizes
          </label>
          <Controller
            name="hasSizes"
            control={control}
            render={({ field }) => (
              <Checkbox
                id="hasSizes"
                checked={field.value}
                onCheckedChange={(value) => {
                  field.onChange(value)
                  // Reset sizes within all color variants when toggling has sizes
                  const currentColors = watch('colors')
                  const updatedColors = currentColors.map(color => ({
                    ...color,
                    sizes: [],
                    quantity: value ? 0 : color.quantity || 0 // Keep quantity if switching to no sizes
                  }))
                  setValue('colors', updatedColors, { shouldDirty: true, shouldValidate: true })
                }}
              />
            )}
          />
        </div>

        {watch('hasSizes') && (
          <div>
            <p className="mb-2">Size Type</p>
            <Controller
              name="sizeType"
              control={control}
              render={({ field }) => (
                <ToggleGroup
                  type="single"
                  value={field.value}
                  onValueChange={(value) => {
                    if (value) {
                      field.onChange(value)
                      // Reset sizes within all color variants when changing size type
                      const currentColors = watch('colors')
                      const updatedColors = currentColors.map(color => ({
                        ...color,
                        sizes: []
                      }))
                      setValue('colors', updatedColors, { shouldDirty: true, shouldValidate: true })
                    }
                  }}
                  className="flex gap-2"
                >
                  <ToggleGroupItem
                    value="clothing"
                    className={`px-4 py-2 border rounded-md ${
                      field.value === 'clothing' ? 'bg-black text-white' : ''
                    }`}
                  >
                    Clothing Sizes
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="shoes"
                    className={`px-4 py-2 border rounded-md ${
                      field.value === 'shoes' ? 'bg-black text-white' : ''
                    }`}
                  >
                    Shoe Sizes
                  </ToggleGroupItem>
                </ToggleGroup>
              )}
            />
          </div>
        )}
      </div>

      <div className='flex items-center gap-2 mt-2 '>
        <label
          htmlFor="bestseller"
          className="cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Add to bestseller
        </label>
        <Controller
          name="bestseller"
          control={control}
          render={({ field }) => (
            <Checkbox 
              id="bestseller" 
              checked={field.value}
              onCheckedChange={(value) => field.onChange(value)}
            />
          )}
        />
      </div>

      <div className='flex items-center gap-2 mt-2'>
        <label
          htmlFor="preorder"
          className="cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Set as preorder
        </label>
        <Controller
          name="preorder"
          control={control}
          render={({ field }) => (
            <Checkbox 
              id="preorder" 
              checked={field.value}
              onCheckedChange={(value) => field.onChange(value)}
            />
          )}
        />
      </div>

      <div className='w-full'>
        <p className='mb-2'>Product Label</p>
        <Controller
          name="label"
          control={control}
          render={({ field }) => (
            <Select 
              value={field.value || "none"}
              onValueChange={(value) => field.onChange(value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select a label..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Label</SelectItem>
                <SelectItem value="New model">New model</SelectItem>
                <SelectItem value="Limited Edition">Limited Edition</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </div>

      {canAddColors && (
        <div className="w-full mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">Color Variants</h2>
            <button
              type="button"
              onClick={() => append({
                colorName: '',
                colorHex: '#000000',
                colorImages: [],
                sizes: [],
                quantity: 0
              })}
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
            >
              Add New Color
            </button>
          </div>

          {fields.map((field, index) => (
            <ColorVariant
              key={field.id}
              index={index}
              control={control}
              remove={remove}
              watch={watch}
              getSizeOptions={getSizeOptions}
            />
          ))}
        </div>
      )}

      <button 
        type='submit' 
        disabled={isSubmitting || (isEditMode && !isDirty)}
        className={`group text-sm mt-4 cursor-pointer pl-5 pr-4 py-2 rounded-lg flex items-center
          ${isSubmitting 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-gray-700 hover:bg-gray-900'} 
          text-white`}
      >
        {isSubmitting ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            {isEditMode ? 'Updating Product...' : 'Adding Product...'}
          </span>
        ) : (
          <>
            <p>{isEditMode ? 'Update Product' : 'Add Product'}</p>
            <svg 
              className='transition-all duration-200 group-hover:rotate-90 ml-2 text-white' 
              width="30" 
              height="30" 
              fill="none" 
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="10" stroke="#ffffff" strokeWidth="1.5"/>
              <path 
                stroke="#ffffff" 
                strokeLinecap="round" 
                strokeWidth="1.5" 
                d="M15 12h-3m0 0H9m3 0V9m0 3v3"
              />
            </svg>
          </>
        )}
      </button>
    </form>
  )
}

export default Add