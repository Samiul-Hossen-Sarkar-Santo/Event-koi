const express = require('express');
const router = express.Router();
const Category = require('../models/Category');

// GET /categories - Get all active categories
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find({ 
      isActive: true,
      status: 'approved' 
    }).sort({ name: 1 }).select('name description icon color');
    
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Error fetching categories', error: error.message });
  }
});

// GET /categories/dropdown - Get categories formatted for dropdown/select elements
router.get('/dropdown', async (req, res) => {
  try {
    const categories = await Category.find({ 
      isActive: true,
      status: 'approved' 
    }).sort({ name: 1 }).select('name description');
    
    // Format for dropdown/select elements
    const dropdownOptions = categories.map(cat => ({
      value: cat.name,
      label: cat.description || cat.name.charAt(0).toUpperCase() + cat.name.slice(1),
      name: cat.name
    }));
    
    res.json(dropdownOptions);
  } catch (error) {
    console.error('Error fetching categories for dropdown:', error);
    res.status(500).json({ message: 'Error fetching categories', error: error.message });
  }
});

// GET /categories/homepage - Get categories formatted for homepage display
router.get('/homepage', async (req, res) => {
  try {
    const categories = await Category.find({ 
      isActive: true,
      status: 'approved' 
    }).sort({ name: 1 }).select('name description icon color');
    
    // Format for homepage category grid
    const homepageCategories = categories.map(cat => ({
      name: cat.name,
      displayName: cat.description || cat.name.charAt(0).toUpperCase() + cat.name.slice(1),
      description: cat.description,
      icon: cat.icon || 'fas fa-calendar',
      color: cat.color || '#3B82F6',
      url: `events.html?category=${cat.name}`
    }));
    
    res.json(homepageCategories);
  } catch (error) {
    console.error('Error fetching categories for homepage:', error);
    res.status(500).json({ message: 'Error fetching categories', error: error.message });
  }
});

module.exports = router;
