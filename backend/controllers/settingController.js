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

    console.log('Received form data:', req.body)

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

    console.log('Parsed form data:', formData)

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

    // Handle legal documents
    if (formData.legal) {
      updateData.legal = typeof formData.legal === 'string'
        ? JSON.parse(formData.legal)
        : formData.legal
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

    console.log('Update data to be applied:', updateData)

    const settings = await Setting.findOneAndUpdate(
      {},
      { $set: updateData },
      { new: true, upsert: true }
    )

    console.log('Settings updated successfully:', settings)

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
    console.log('Fetching settings...')
    let settings = await Setting.findOne()
    console.log('Found settings:', settings ? 'Yes' : 'No')

    if (!settings) {
      console.log('Creating new settings document...')
      settings = await Setting.create({
        currency: { name: process.env.CURRENCY || 'XAF', sign: process.env.CURRENCY_SYMBOL || 'FCFA' },
        email: { notifications: 'notifications@example.com' },
        images: { hero: [], banner: '' },
        text: { banner: '', hero: '' },
        link: {
          productId: '',
          category: '',
          subcategory: '',
          subsubcategory: ''
        },
        herolink: {
          productId: '',
          category: '',
          subcategory: '',
          subsubcategory: ''
        },
        legal: {
          privacyPolicy: '',
          termsAndConditions: ''
        }
      })
      console.log('Created new settings:', settings)
    }

    // Ensure legal field exists even in existing documents
    if (!settings.legal) {
      console.log('Adding legal field to existing settings...')
      settings.legal = {
        privacyPolicy: '',
        termsAndConditions: ''
      }
      await settings.save()
    }

    console.log('Returning settings with legal field:', !!settings.legal)
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

// Get legal documents (public route)
export const getLegalDocuments = async (req, res) => {
  try {
    const settings = await Setting.findOne();

    if (!settings) {
      return res.json({
        success: true,
        legal: {
          privacyPolicy: '',
          termsAndConditions: ''
        }
      });
    }

    res.json({
      success: true,
      legal: settings.legal || {
        privacyPolicy: '',
        termsAndConditions: ''
      }
    });
  } catch (error) {
    console.error('Get legal documents error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get legal documents'
    });
  }
};