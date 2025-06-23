import React, { useCallback } from 'react';
import { Controller, useFieldArray } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import FileUpload from './FileUpload';

const ColorVariant = ({ index, control, remove, watch, setValue, getSizeOptions }) => {
  // Use useFieldArray for sizes within this color variant
  const { fields: sizeFields, append: appendSize, remove: removeSize } = useFieldArray({
    control,
    name: `colors.${index}.sizes`,
    // This is critical - it prevents re-rendering of the entire component
    // when only the sizes array changes
    keyName: "fieldId" 
  });

  // Get available size options based on current category/subcategory
  const sizeOptions = getSizeOptions ? getSizeOptions() : [];
  
  // Use memoized handlers to prevent re-renders
  const handleSizeToggle = useCallback((sizeValue) => {
    // Check if size already exists
    const existingIndex = sizeFields.findIndex(field => field.size === sizeValue);
    
    if (existingIndex >= 0) {
      // Size exists, remove it
      removeSize(existingIndex);
    } else {
      // Size doesn't exist, add it
      appendSize({ size: sizeValue, quantity: 1 });
    }
  }, [sizeFields, appendSize, removeSize]);

  // Handle quantity change without losing focus
  const handleQuantityChange = useCallback((sizeIndex, value) => {
    // Use setValue directly to avoid re-renders
    setValue(`colors.${index}.sizes.${sizeIndex}.quantity`, value, {
      shouldValidate: false,
      shouldDirty: true,
      shouldTouch: false
    });
  }, [setValue, index]);

  return (
    <div className="mb-8 p-4 border rounded-lg bg-gray-50">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium">Color Variant {index + 1}</h3>
        <button
          type="button"
          onClick={() => remove(index)}
          className="text-red-500 hover:text-red-700 px-3 py-1 rounded"
        >
          Remove
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block mb-2 text-sm">Color Name</label>
          <Controller
            name={`colors.${index}.colorName`}
            control={control}
            render={({ field }) => (
              <input
                {...field}
                type="text"
                placeholder="e.g. Navy Blue"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.preventDefault();
                }}
              />
            )}
          />
        </div>

        <div>
          <label className="block mb-2 text-sm">Color Hex</label>
          <Controller
            name={`colors.${index}.colorHex`}
            control={control}
            render={({ field }) => (
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={field.value || '#000000'}
                  onChange={(e) => field.onChange(e.target.value)}
                  className="w-12 h-10 p-1 border border-gray-300 rounded"
                />
                <input
                  type="text"
                  value={field.value || ''}
                  onChange={(e) => field.onChange(e.target.value)}
                  placeholder="#000000"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') e.preventDefault();
                  }}
                />
              </div>
            )}
          />
        </div>
      </div>

      <div className="mb-4">
        <label className="block mb-2 text-sm">Color Images (up to 4)</label>
        <Controller
          name={`colors.${index}.colorImages`}
          control={control}
          render={({ field }) => (
            <FileUpload
              value={field.value || []}
              onChange={(files) => {
                field.onChange(files);
              }}
              maxFiles={4}
              label={`Upload images for this color`}
            />
          )}
        />
      </div>

      <div>
        <label className="block mb-2 text-sm">Available Sizes & Quantities</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-4">
          {sizeOptions.map((sizeOption) => {
            // Check if this size is already selected
            const isSelected = sizeFields.some(field => field.size === sizeOption);
            
            return (
              <div 
                key={sizeOption} 
                className={`border rounded-md p-2 transition-colors
                  ${isSelected ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-100'}`}
              >
                <div className="flex items-center justify-between">
                  <span>{sizeOption}</span>
                  <input 
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleSizeToggle(sizeOption)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Quantity inputs for selected sizes */}
        {sizeFields.length > 0 && (
          <div className="mt-4 border-t pt-4">
            <h4 className="font-medium mb-2">Set Quantities</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {sizeFields.map((field, sizeIndex) => (
                <div key={field.fieldId} className="flex flex-col">
                  <label className="text-sm mb-1">{field.size}</label>
                  <input
                    type="number"
                    min="0"
                    value={field.quantity}
                    onChange={(e) => {
                      const value = Math.max(0, parseInt(e.target.value) || 0);
                      handleQuantityChange(sizeIndex, value);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') e.preventDefault();
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(ColorVariant);



