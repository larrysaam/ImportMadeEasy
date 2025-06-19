import React, { useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/Dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner';
import axios from 'axios';
import { backendUrl } from '../App';
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import * as z from "zod";
import { FilePond, registerPlugin } from 'react-filepond';
import 'filepond/dist/filepond.min.css';
import FilePondPluginImageExifOrientation from 'filepond-plugin-image-exif-orientation';
import FilePondPluginImagePreview from 'filepond-plugin-image-preview';
import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css';

registerPlugin(FilePondPluginImageExifOrientation, FilePondPluginImagePreview);

const CLOTHING_SIZES = ['S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'];
const SHOE_SIZES = Array.from({ length: 23 }, (_, i) => (i + 26).toString());
const KIDS_SHOE_SIZES = Array.from({ length: 13 }, (_, i) => (i + 26).toString());

const EditProductDialog = ({ product, isOpen, onClose, onUpdate, token }) => {
  const pondRef = useRef();
  const [availableSubcategories, setAvailableSubcategories] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState({});

  const validationSchema = z.object({
    images: z.any(),
    name: z.string().min(2, {message: "Enter product name"}),
    description: z.string().min(2, {message: "Description is required"}),
    price: z.coerce.number().positive({message: "Please enter product price"}),
    category: z.string().min(1, {message: "Category is required"}),
    subcategory: z.string().min(1, {message: "Subcategory is required"}),
    sizes: z.array(z.object({
      size: z.string(),
      quantity: z.number().min(0, "Quantity cannot be negative")
    })).nonempty({ message: "Choose at least 1 size with quantity" }),
    bestseller: z.boolean(),
    preorder: z.boolean()
  });

  const { control, handleSubmit, reset, watch, formState: { errors } } = useForm({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      images: product?.image || [],
      name: product?.name || "",
      description: product?.description || "",
      price: product?.price || "",
      category: product?.category || "",
      subcategory: product?.subcategory || "",
      sizes: product?.sizes || [],
      bestseller: product?.bestseller || false,
      preorder: product?.preorder || false,
    },
  });

  const fetchSubcategories = async (selectedCategory) => {
    if (!selectedCategory) return;
    
    try {
      const response = await axios.get(`${backendUrl}/api/categories`, {
        headers: { token }
      });
      if (response.data.success) {
        const { categories } = response.data;
        const subcats = categories[selectedCategory]?.filter(item => typeof item === 'string') || [];
        setAvailableSubcategories(subcats);
      }
    } catch (error) {
      toast.error('Failed to fetch subcategories');
      console.error(error);
    }
  };

  const onSubmit = async (values) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();

      let sizesWeights = {
        'XS':1, 'S':2, 'M':3, 'L':4, 'XL':5
      };
      let sortedSizes = values.sizes.sort((a,b) => sizesWeights[a] - sizesWeights[b]);

      formData.append('name', values.name);
      formData.append('description', values.description);
      formData.append('price', values.price);
      formData.append('category', values.category);
      formData.append('subcategory', values.subcategory);
      formData.append('sizes', JSON.stringify(sortedSizes));
      formData.append('bestseller', values.bestseller);
      formData.append('preorder', values.preorder);

      // Handle both existing images and new uploads
      if (values.images) {
        for (let i = 0; i < values.images.length; i++) {
          if (values.images[i].file) {
            formData.append(`image${i+1}`, values.images[i].file);
          } else {
            formData.append(`existingImage${i+1}`, values.images[i]);
          }
        }
      }

      const response = await axios.put(
        `${backendUrl}/api/product/update/${product._id}`,
        formData,
        { headers: { token } }
      );

      if (response.data.success) {
        toast.success('Product updated successfully!');
        onUpdate();
        onClose();
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to update product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSizeOptions = () => {
    const category = watch('category');
    const subcategory = watch('subcategory');

    if (subcategory?.toLowerCase().includes('shoes') || 
        subcategory?.toLowerCase().includes('sneakers') || 
        subcategory?.toLowerCase().includes('boots')) {
      return category === 'Kids' ? KIDS_SHOE_SIZES : SHOE_SIZES;
    }
    return CLOTHING_SIZES;
  };

  useEffect(() => {
    const selectedCategory = watch('category');
    if (selectedCategory) {
      fetchSubcategories(selectedCategory);
    }
  }, [watch('category')]);

  // Fetch categories when dialog opens
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${backendUrl}/api/categories`, {
          headers: { token }
        });
        if (response.data.success) {
          // Filter out _id and __v from categories
          const cleanCategories = Object.fromEntries(
            Object.entries(response.data.categories).map(([key, value]) => [
              key,
              value.filter(item => typeof item === 'string')
            ])
          );
          setCategories(cleanCategories);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        toast.error('Failed to load categories');
      }
    };

    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen, token]);

  // Add effect to fetch subcategories when component mounts or category changes
  useEffect(() => {
    const fetchInitialSubcategories = async () => {
      if (product?.category) {
        try {
          const response = await axios.get(`${backendUrl}/api/categories`, {
            headers: { token }
          });
          if (response.data.success) {
            const { categories } = response.data;
            // Filter out non-string values and set available subcategories
            const subcats = categories[product.category]?.filter(item => typeof item === 'string') || [];
            setAvailableSubcategories(subcats);
          }
        } catch (error) {
          console.error('Failed to fetch initial subcategories:', error);
        }
      }
    };

    fetchInitialSubcategories();
  }, [product, token]);

  // Update subcategory select component
  const renderSubcategorySelect = () => (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium">Subcategory</label>
      <Controller
        name="subcategory"
        control={control}
        render={({ field }) => (
          <Select
            {...field}
            disabled={!watch('category')}
            value={field.value || ""}
            onValueChange={(value) => field.onChange(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Choose subcategory" />
            </SelectTrigger>
            <SelectContent>
              {availableSubcategories.map((subcat) => (
                <SelectItem key={subcat} value={subcat}>
                  {subcat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
      {errors.subcategory && (
        <p className="text-red-500 text-xs">{errors.subcategory.message}</p>
      )}
    </div>
  );

  // Update category select to handle subcategory changes
  const handleCategoryChange = (value) => {
    const currentValues = watch();
    reset({
      ...currentValues,
      category: value,
      subcategory: '' // Reset subcategory when category changes
    });
    fetchSubcategories(value);
  };

  // Update the Category Select component in the form
  const renderCategorySelect = () => (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium">Category</label>
      <Controller
        name="category"
        control={control}
        render={({ field }) => (
          <Select
            {...field}
            value={field.value || ""}
            onValueChange={handleCategoryChange}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Choose category" />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(categories).map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
      {errors.category && <p className="text-red-500 text-xs">{errors.category.message}</p>}
    </div>
  );

  // Update the form section that contains categories
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-5xl h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className='flex flex-col w-full items-start gap-3'>
          {/* Product Details Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Product Name</label>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <Input {...field} placeholder="Enter product name" />
                )}
              />
              {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Price</label>
              <Controller
                name="price"
                control={control}
                render={({ field }) => (
                  <Input {...field} type="number" placeholder="Enter product price" />
                )}
              />
              {errors.price && <p className="text-red-500 text-xs">{errors.price.message}</p>}
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Category</label>
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    value={field.value || ""}
                    onValueChange={handleCategoryChange}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Choose category" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(categories).map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.category && <p className="text-red-500 text-xs">{errors.category.message}</p>}
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Subcategory</label>
              <Controller
                name="subcategory"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    disabled={!watch('category')}
                    value={field.value || ""}
                    onValueChange={(value) => field.onChange(value)}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Choose subcategory" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSubcategories.map((subcat) => (
                        <SelectItem key={subcat} value={subcat}>
                          {subcat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.subcategory && <p className="text-red-500 text-xs">{errors.subcategory.message}</p>}
            </div>
          </div>

          <div className="w-full">
            <label className="text-sm font-medium">Description</label>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <Textarea {...field} placeholder="Enter product description" className="resize-none" />
              )}
            />
            {errors.description && <p className="text-red-500 text-xs">{errors.description.message}</p>}
          </div>

          {/* Sizes Section */}
          <div className="w-full">
            <label className="text-sm font-medium mb-2 block">Sizes & Quantities</label>
            <Controller
              name="sizes"
              control={control}
              render={({ field }) => (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-w-[800px]">
                  {getSizeOptions().map((sizeOption) => {
                    const existingSize = field.value.find(s => s.size === sizeOption);
                    
                    return (
                      <div key={sizeOption} className="flex flex-col gap-2 p-3 border rounded-md">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{sizeOption}</span>
                          <Checkbox 
                            checked={Boolean(existingSize)}
                            onCheckedChange={(checked) => {
                              const newSizes = checked
                                ? [...field.value, { size: sizeOption, quantity: 0 }]
                                : field.value.filter(s => s.size !== sizeOption);
                              field.onChange(newSizes);
                            }}
                          />
                        </div>
                        
                        {existingSize && (
                          <div className="flex flex-col gap-2">
                            <Input
                              type="number"
                              min="0"
                              value={existingSize.quantity}
                              onChange={(e) => {
                                const quantity = parseInt(e.target.value) || 0;
                                const newSizes = field.value.map(s => 
                                  s.size === sizeOption ? { ...s, quantity } : s
                                );
                                field.onChange(newSizes);
                              }}
                              className="w-full"
                              placeholder="Quantity"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const newSizes = field.value.filter(s => s.size !== sizeOption);
                                field.onChange(newSizes);
                              }}
                              className="text-xs text-red-500 hover:text-red-700 transition-colors"
                            >
                              Remove
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            />
            {errors.sizes && (
              <p className="text-red-500 text-xs mt-1">{errors.sizes.message}</p>
            )}
          </div>

          {/* Images Section */}
          <div className="w-full">
            <label className="text-sm font-medium">Product Images</label>
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {watch('images').map((image, index) => (
                  <div key={index} className="relative aspect-square">
                    <img
                      src={image}
                      alt={`Product ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const currentImages = watch('images');
                        setValue('images', currentImages.filter((_, i) => i !== index));
                      }}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              
              <Controller
                name="images"
                control={control}
                render={({ field }) => (
                  <FilePond
                    ref={pondRef}
                    files={field.value}
                    allowMultiple={true}
                    onupdatefiles={(fileItems) => {
                      field.onChange(fileItems.map(fileItem => fileItem.file));
                    }}
                    name="files"
                    labelIdle='Drag & drop your files or <span class="filepond--label-action">Browse</span>'
                  />
                )}
              />
              {errors.images && <p className="text-red-500 text-xs">{errors.images.message}</p>}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-4 w-full">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-sm border rounded-full hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 text-sm bg-black text-white rounded-full hover:bg-gray-800 disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Updating...' : 'Update Product'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditProductDialog;