import Category from '../models/categoryModel.js';

// Add main category
export const addMainCategory = async (req, res) => {
  try {
    const { name } = req.body;
    
    const exists = await Category.findOne({ name });
    if (exists) {
      return res.status(400).json({
        success: false,
        message: 'Category already exists'
      });
    }

    const category = new Category({ name });
    await category.save();

    res.json({
      success: true,
      message: 'Category added successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Add subcategory
export const addSubcategory = async (req, res) => {
  try {
    const { mainCategory, name } = req.body;
    
    const category = await Category.findOne({ name: mainCategory });
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Main category not found'
      });
    }

    // Check if subcategory already exists
    const exists = category.subcategories.some(sub => sub.name === name);
    if (exists) {
      return res.status(400).json({
        success: false,
        message: 'Subcategory already exists'
      });
    }

    category.subcategories.push({ name });
    await category.save();

    res.json({
      success: true,
      message: 'Subcategory added successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Add second level subcategory
export const addSecondLevelSubcategory = async (req, res) => {
  try {
    const { mainCategory, subcategory, name } = req.body;
    
    const category = await Category.findOne({ name: mainCategory });
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Main category not found'
      });
    }

    const sub = category.subcategories.find(s => s.name === subcategory);
    if (!sub) {
      return res.status(404).json({
        success: false,
        message: 'Subcategory not found'
      });
    }

    // Check if second level subcategory already exists
    const exists = sub.subcategories.some(subsub => subsub.name === name);
    if (exists) {
      return res.status(400).json({
        success: false,
        message: 'Second level subcategory already exists'
      });
    }

    sub.subcategories.push({ name });
    await category.save();

    res.json({
      success: true,
      message: 'Second level subcategory added successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete category at any level
export const deleteCategory = async (req, res) => {
  try {
    const { path } = req.body;

    if (path.length === 1) {
      // Delete main category
      await Category.deleteOne({ name: path[0] });
    } else if (path.length === 2) {
      // Delete subcategory
      await Category.updateOne(
        { name: path[0] },
        { $pull: { subcategories: { name: path[1] } } }
      );
    } else if (path.length === 3) {
      // Delete second level subcategory
      await Category.updateOne(
        { name: path[0], 'subcategories.name': path[1] },
        { $pull: { 'subcategories.$.subcategories': { name: path[2] } } }
      );
    }

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get all categories
export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({});
    res.json({
      success: true,
      categories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getUserCategories = async (req, res) => {
  try {
    const categories = await Category.find({});
    const formattedCategories = categories.reduce((acc, category) => {
      acc[category.name] = {
        subcategories: category.subcategories.map(firstLevel => ({
          name: firstLevel.name,
          subcategories: firstLevel.subcategories.map(subSub => subSub.name)
        }))
      };
      return acc;
    }, {});

    res.json({
      success: true,
      categories: formattedCategories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};