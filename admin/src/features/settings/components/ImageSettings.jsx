import React from 'react'
import { Input } from '@/components/ui/input'

export const ImageSettings = ({ 
  settings,
  onSettingsChange,
  heroFiles,
  bannerFile,
  onHeroImagesChange,
  onBannerImageChange
}) => {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Image Settings</h2>
      
      {/* Hero Images Section */}
      <div>
        <label className="block text-sm mb-2">Hero Images (up to 5)</label>
        <Input
          type="file"
          accept="image/*"
          multiple
          onChange={onHeroImagesChange}
          className="mb-4"
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {settings.images.hero.map((image, index) => (
            <div key={index} className="relative group">
              <img 
                src={image}
                alt={`Hero ${index + 1}`}
                className="w-full h-40 object-cover rounded-lg"
              />
              <button
                onClick={() => {
                  const newHeroImages = [...settings.images.hero];
                  newHeroImages.splice(index, 1);
                  onSettingsChange({
                    ...settings,
                    images: { ...settings.images, hero: newHeroImages }
                  });
                }}
                className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full 
                         opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Banner Image Section */}
      <div>
        <label className="block text-sm mb-2">Banner Image</label>
        <Input
          type="file"
          accept="image/*"
          onChange={onBannerImageChange}
          className="mb-4"
        />
        {settings.images.banner && (
          <div className="relative group w-full">
            <img 
              src={settings.images.banner}
              alt="Banner"
              className="w-full h-48 object-cover rounded-lg"
            />
            <button
              onClick={() => onSettingsChange({
                ...settings,
                images: { ...settings.images, banner: '' }
              })}
              className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full 
                       opacity-0 group-hover:opacity-100 transition-opacity"
            >
              ×
            </button>
          </div>
        )}
      </div>
    </div>
  )
}