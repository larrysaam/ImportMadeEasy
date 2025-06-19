import React from 'react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export const HeroLinkSection = ({ 
  settings = { text: { hero: '' } }, // Add default value
  onSettingsChange,
  heroText = '', // Add default value
  onHeroTextChange,
  heroLinkType = 'product', // Add default value
  onHeroLinkTypeChange,
  selectedHeroLink = { // Add default value
    productId: '',
    category: '',
    subcategory: '',
    subsubcategory: ''
  },
  onHeroLinkChange,
  products = [], // Add default value
  categories = {} // Add default value
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Hero Link Settings</h3>
      <div className="space-y-3">
        <div>
          <label className="block text-sm mb-2">Hero Text</label>
          <Input
            type="text"
            value={heroText}
            placeholder="Enter hero text"
            onChange={(e) => onHeroTextChange?.(e.target.value)}
            className="mb-2"
          />
          {settings?.text?.hero && heroText !== settings.text.hero && (
            <p className="text-sm text-gray-500">
              Current text: {settings.text.hero}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm mb-2">Link Type</label>
          <Select value={heroLinkType} onValueChange={onHeroLinkTypeChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select link type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="product">Product Link</SelectItem>
              <SelectItem value="category">Category Link</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {heroLinkType === 'product' ? (
          <div>
            <label className="block text-sm mb-2">Select Product</label>
            <Select 
              value={selectedHeroLink.productId || ''} 
              onValueChange={(value) => onHeroLinkChange('productId', value)}
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
                value={selectedHeroLink.category || ''} 
                onValueChange={(value) => onHeroLinkChange('category', value)}
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

            {selectedHeroLink.category && (
              <div>
                <label className="block text-sm mb-2">Subcategory</label>
                <Select 
                  value={selectedHeroLink.subcategory || ''} 
                  onValueChange={(value) => onHeroLinkChange('subcategory', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select subcategory" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories[selectedHeroLink.category]?.subcategories.map(sub => (
                      <SelectItem key={sub.name} value={sub.name}>
                        {sub.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedHeroLink.subcategory && (
              <div>
                <label className="block text-sm mb-2">Second Level Category</label>
                <Select 
                  value={selectedHeroLink.subsubcategory || ''} 
                  onValueChange={(value) => onHeroLinkChange('subsubcategory', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select second level category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories[selectedHeroLink.category]?.subcategories
                      .find(sub => sub.name === selectedHeroLink.subcategory)
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