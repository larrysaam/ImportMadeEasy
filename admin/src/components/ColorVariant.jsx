// Fix the size selection and quantity handling in ColorVariant component
const SizeSelector = ({ field, colorIndex, setValue }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {getSizeOptions().map((size) => {
        // Find if this size exists in the current sizes array
        const existingSize = field.value?.find(s => s.size === size);
        const isChecked = Boolean(existingSize);
        
        return (
          <div key={size} className="flex flex-col gap-2 p-3 border rounded-md min-h-[100px]">
            <div className="flex items-center justify-between">
              <span className="font-medium">{size}</span>
              <Checkbox 
                checked={isChecked}
                onCheckedChange={(checked) => {
                  const currentSizes = [...(field.value || [])];
                  
                  if (checked) {
                    // Only add if it doesn't already exist
                    if (!currentSizes.some(s => s.size === size)) {
                      currentSizes.push({ size, quantity: 0 });
                    }
                  } else {
                    // Remove this size
                    const index = currentSizes.findIndex(s => s.size === size);
                    if (index !== -1) {
                      currentSizes.splice(index, 1);
                    }
                  }
                  
                  // Update the form
                  setValue(`colors.${colorIndex}.sizes`, currentSizes, { 
                    shouldValidate: true,
                    shouldDirty: true 
                  });
                }}
                className="border-brand data-[state=checked]:bg-brand data-[state=checked]:text-white"
              />
            </div>
            
            {/* Always render the input but conditionally show/hide it */}
            <div className={isChecked ? "block" : "hidden"}>
              <Input
                type="number"
                min="0"
                placeholder="Qty"
                className="w-full focus:border-brand focus:ring-brand/50"
                value={existingSize?.quantity || 0}
                onChange={(e) => {
                  const quantity = parseInt(e.target.value, 10) || 0;
                  const currentSizes = [...(field.value || [])];
                  
                  // Find and update the quantity
                  const index = currentSizes.findIndex(s => s.size === size);
                  if (index !== -1) {
                    currentSizes[index].quantity = quantity;
                    
                    // Update the form
                    setValue(`colors.${colorIndex}.sizes`, currentSizes, { 
                      shouldValidate: true,
                      shouldDirty: true 
                    });
                  }
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Update the main ColorVariant component to use the new SizeSelector
const ColorVariant = ({ index: colorIndex, control, remove, watch, getSizeOptions }) => {
  return (
    <div className="border rounded-lg p-4 mb-4 bg-gray-50">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium">Color Variant {colorIndex + 1}</h3>
        <button
          type="button"
          onClick={() => remove(colorIndex)}
          className="text-red-500 hover:text-red-700 px-3 py-1 rounded border border-red-300 hover:bg-red-50"
        >
          Remove Color
        </button>
      </div>

      {/* Color name input */}
      <div className="mb-4">
        <p className="font-medium mb-2">Color Name</p>
        <Controller
          name={`colors.${colorIndex}.colorName`}
          control={control}
          render={({ field, fieldState: { error } }) => (
            <>
              <Input 
                {...field} 
                placeholder="e.g. Red, Blue, Green" 
                className="w-full max-w-md focus:border-brand focus:ring-brand/50"
              />
              {error && <p className="text-red-500 text-sm mt-1">{error.message}</p>}
            </>
          )}
        />
      </div>

      {/* Color hex input */}
      <div className="mb-4">
        <p className="font-medium mb-2">Color Hex Code</p>
        <Controller
          name={`colors.${colorIndex}.colorHex`}
          control={control}
          render={({ field, fieldState: { error } }) => (
            <>
              <div className="flex items-center gap-3 max-w-md">
                <Input 
                  {...field} 
                  placeholder="#000000" 
                  className="w-full focus:border-brand focus:ring-brand/50"
                />
                <div 
                  className="w-10 h-10 rounded-md border border-gray-300"
                  style={{ backgroundColor: field.value || '#000000' }}
                ></div>
              </div>
              {error && <p className="text-red-500 text-sm mt-1">{error.message}</p>}
            </>
          )}
        />
      </div>

      {/* Color images upload */}
      <div className="mb-4">
        <p className="font-medium mb-2">Color Images (up to 4)</p>
        <Controller
          name={`colors.${colorIndex}.colorImages`}
          control={control}
          render={({ field, fieldState: { error } }) => (
            <>
              <FileUpload
                value={field.value || []}
                onChange={field.onChange}
                maxFiles={4}
                label={`Upload images for this color`}
              />
              {error && <p className="text-red-500 text-sm mt-1">{error.message}</p>}
            </>
          )}
        />
      </div>

      {/* Sizes section with the new SizeSelector component */}
      <div className="sizes-section mt-4">
        <p className="font-medium mb-4">Sizes and Quantities</p>
        <Controller
          name={`colors.${colorIndex}.sizes`}
          control={control}
          render={({ field, fieldState: { error } }) => (
            <>
              <SizeSelector 
                field={field} 
                colorIndex={colorIndex} 
                setValue={setValue} 
                getSizeOptions={getSizeOptions} 
              />
              {error && <p className="text-red-500 text-sm mt-1">{error.message}</p>}
            </>
          )}
        />
      </div>
    </div>
  );
};

// Add CSS to prevent layout shifts
<style jsx>{`
  .size-item {
    min-height: 100px;
    display: flex;
    flex-direction: column;
  }
  
  .size-item-content {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
  }
  
  .quantity-input {
    margin-top: auto;
  }
  
  .checkbox-wrapper {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }
`}</style>


