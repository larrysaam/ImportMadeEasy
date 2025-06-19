import React from 'react'

export const Banners = ({bannername, img, setBannerFile}) => {


    return(
         <div>
              <label className="block text-sm mb-2">{bannername}</label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setBannerFile(e.target.files[0])}
              />
              {settings.images.banner && (
                <img 
                  src={`${img}`}
                  alt="Banner"
                  className="mt-2 max-w-full h-auto"
                />
              )}
            </div>
    )
}
