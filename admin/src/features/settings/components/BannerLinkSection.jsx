import React from 'react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export const BannerLinkSection = ({ 
  settings = { text: { banner: '' } }, // Add default value
  onSettingsChange,
  bannerText = '', // Add default value
  onBannerTextChange,
  linkType = 'product', // Add default value
  onLinkTypeChange,
  selectedLink = { // Add default value
    productId: '',
    category: '',
    subcategory: '',
    subsubcategory: ''
  },
  onLinkChange,
  products = [], // Add default value
  categories = {} // Add default value
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Banner Link Settings</h3>
      <div className="space-y-3">
        <div>
          <label className="block text-sm mb-2">Banner Text</label>
          <Input
            type="text"
            value={bannerText}
            placeholder="Enter banner text"
            onChange={(e) => onBannerTextChange?.(e.target.value)}
            className="mb-2"
          />
          {settings?.text?.banner && bannerText !== settings.text.banner && (
            <p className="text-sm text-gray-500">
              Current text: {settings.text.banner}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm mb-2">Link Type</label>
          <Select value={linkType} onValueChange={onLinkTypeChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select link type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="product">Product Link</SelectItem>
              <SelectItem value="category">Category Link</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {linkType === 'product' ? (
          <div>
            <label className="block text-sm mb-2">Select Product</label>
            <Select 
              value={selectedLink.productId || ''} 
              onValueChange={(value) => onLinkChange('productId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a product" />
              </SelectTrigger>
              <SelectContent>
                {products.map(product => (
                  <SelectItem key={product._id} value={product._id}>
                    <div className="flex items-center gap-2">
                      <img 
                        src={product.image[0]} 
                        alt={product.name}
                        className="w-8 h-8 object-cover rounded"
                      />
                      <span>{product.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block text-sm mb-2">Category</label>
              <Select 
                value={selectedLink.category || ''} 
                onValueChange={(value) => onLinkChange('category', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(categories).map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedLink.category && (
              <div>
                <label className="block text-sm mb-2">Subcategory</label>
                <Select 
                  value={selectedLink.subcategory || ''} 
                  onValueChange={(value) => onLinkChange('subcategory', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select subcategory" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories[selectedLink.category]?.subcategories.map(sub => (
                      <SelectItem key={sub.name} value={sub.name}>
                        {sub.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedLink.subcategory && (
              <div>
                <label className="block text-sm mb-2">Second Level Category</label>
                <Select 
                  value={selectedLink.subsubcategory || ''} 
                  onValueChange={(value) => onLinkChange('subsubcategory', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select second level category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories[selectedLink.category]?.subcategories
                      .find(sub => sub.name === selectedLink.subcategory)
                      ?.subcategories.map(subSub => (
                        <SelectItem key={subSub.name} value={subSub.name}>
                          {subSub.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}