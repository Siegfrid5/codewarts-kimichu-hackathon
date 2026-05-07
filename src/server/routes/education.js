/**
 * GABAYANI — Education Routes
 * 
 * GET /api/education/videos      — Get all videos (optional category filter)
 * GET /api/education/videos/search — Search videos by title/description
 * GET /api/education/categories  — Get all unique categories
 */

const express = require('express');
const EducationVideo = require('../models/EducationVideo');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * GET /api/education/videos
 * Get all education videos, optionally filtered by category
 */
router.get('/videos', asyncHandler(async (req, res) => {
  const { category } = req.query;
  
  const videos = await EducationVideo.getAll(category);
  
  res.json({
    success: true,
    data: videos
  });
}));

/**
 * GET /api/education/videos/search
 * Search videos by title or description, optionally filtered by category
 */
router.get('/videos/search', asyncHandler(async (req, res) => {
  const { q: searchQuery, category } = req.query;
  
  if (!searchQuery) {
    return res.status(400).json({
      success: false,
      error: 'Search query parameter "q" is required'
    });
  }
  
  const videos = await EducationVideo.search(searchQuery, category);
  
  res.json({
    success: true,
    data: videos
  });
}));

/**
 * GET /api/education/categories
 * Get all unique video categories
 */
router.get('/categories', asyncHandler(async (req, res) => {
  const categories = await EducationVideo.getCategories();
  
  res.json({
    success: true,
    data: ['All', ...categories]
  });
}));

module.exports = router;
