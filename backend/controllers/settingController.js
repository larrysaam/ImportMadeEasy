import Setting from '../models/settingModel.js'
import cloudinary from 'cloudinary'
import fs from 'fs/promises'
import path from 'path'

// Configure cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

// Add this function to clean up temp files
const cleanupTempFiles = async (files) => {
  try {
    if (!files) return

    const cleanup = async (file) => {
      try {
        await fs.unlink(file.path)
      } catch (error) {
        console.error(`Failed to delete temp file: ${file.path}`)
      }
    }

    if (files.hero) {
      await Promise.all(files.hero.map(cleanup))
    }
    if (files.banner) {
      await cleanup(files.banner[0])
    }
  } catch (error) {
    console.error('Cleanup error:', error)
  }
}

export const updateSettings = async (req, res) => {
  try {
    let updateData = {}

    // Convert form data to proper objects
    const formData = Object.fromEntries(
      Object.entries(req.body).map(([key, value]) => {
        try {
          return [key, JSON.parse(value)]
        } catch {
          return [key, value]
        }
      })
    )

    // Handle basic text and currency settings
    if (formData.currency) {
      updateData.currency = {
        name: formData.currency.name || '',
        sign: formData.currency.sign || ''
      }
    }

    if (formData.email) {
      updateData['email.notifications'] = formData.email.notifications
    }

    if (formData.text) {
      updateData.text = {
        banner: formData.text.banner || '',
        hero: formData.text.hero || ''
      }
    }

    // Handle link data - already in JSON string format
    if (formData.link) {
      updateData.link = typeof formData.link === 'string' 
        ? JSON.parse(formData.link)
        : formData.link
    }
    
    // Handle hero link data - already in JSON string format
    if (formData.herolink) {
      updateData.herolink = typeof formData.herolink === 'string'
        ? JSON.parse(formData.herolink)
        : formData.herolink
    }

    // Handle file uploads
    if (req.files) {
      if (req.files.banner) {
        updateData['images.banner'] = req.files.banner[0].path
      }
      if (req.files.hero) {
        updateData['images.hero'] = req.files.hero.map(file => file.path)
      }
    }

    const settings = await Setting.findOneAndUpdate(
      {},
      { $set: updateData },
      { new: true, upsert: true }
    )

    console.log('Settings updated:', settings)

    res.json({
      success: true,
      settings
    })
  } catch (error) {
    console.error('Settings update error:', error)
    res.status(500).json({
      success: false,
      message: error.message
    })
  } finally {
    await cleanupTempFiles(req.files)
  }
}

export const getSettings = async (req, res) => {
  try {
    let settings = await Setting.findOne()
    
    if (!settings) {
      settings = await Setting.create({
        currency: { name: process.env.CURRENCY || 'EUR', sign: process.env.CURRENCY_SYMBOL || '€' },
        email: { notifications: 'notifications@example.com' },
        images: { hero: [], banner: '' }
      })
    }
    
    res.json({ success: true, settings })
  } catch (error) {
    console.error('Get settings error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

export const updateBannerLink = async (req, res) => {
  try {
    const { linkType, productId, category, subcategory, subsubcategory } = req.body;

    // Prepare the link update object
    const linkUpdate = {
      link: {}
    };

    if (linkType === 'product') {
      linkUpdate.link = {
        productId,
        category: null,
        subcategory: null,
        subsubcategory: null
      };
    } else {
      linkUpdate.link = {
        productId: null,
        category,
        subcategory,
        subsubcategory
      };
    }

    // Find and update settings
    const settings = await Setting.findOneAndUpdate(
      {},
      linkUpdate,
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      settings
    });
  } catch (error) {
    console.error('Banner link update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update banner link'
    });
  }
};