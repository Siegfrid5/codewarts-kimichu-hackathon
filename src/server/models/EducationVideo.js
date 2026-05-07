/**
 * GABAYANI — Education Video Model
 * 
 * Model for farming educational videos from YouTube
 */

const knex = require('../db');

class EducationVideo {
  /**
   * Get all videos, optionally filtered by category
   */
  static async getAll(category = null) {
    let query = knex('education_videos').select('*');
    
    if (category && category !== 'All') {
      query = query.where('category', category);
    }
    
    return query.orderBy('created_at', 'desc');
  }

  /**
   * Search videos by title or description
   */
  static async search(searchQuery, category = null) {
    let query = knex('education_videos')
      .select('*')
      .where((builder) => {
        builder
          .where('title', 'ilike', `%${searchQuery}%`)
          .orWhere('description', 'ilike', `%${searchQuery}%`);
      });
    
    if (category && category !== 'All') {
      query = query.andWhere('category', category);
    }
    
    return query.orderBy('created_at', 'desc');
  }

  /**
   * Get all unique categories
   */
  static async getCategories() {
    const categories = await knex('education_videos')
      .distinct('category')
      .orderBy('category', 'asc');
    
    return categories.map(c => c.category);
  }

  /**
   * Insert a single video
   */
  static async create(videoData) {
    const [video] = await knex('education_videos')
      .insert(videoData)
      .returning('*');
    return video;
  }

  /**
   * Insert multiple videos (bulk insert)
   */
  static async bulkInsert(videosData) {
    const videos = await knex('education_videos')
      .insert(videosData)
      .returning('*');
    return videos;
  }

  /**
   * Get video by ID
   */
  static async findById(id) {
    const [video] = await knex('education_videos')
      .where('id', id)
      .select('*');
    return video;
  }

  /**
   * Get video by YouTube video ID
   */
  static async findByVideoId(videoId) {
    const [video] = await knex('education_videos')
      .where('video_id', videoId)
      .select('*');
    return video;
  }
}

module.exports = EducationVideo;
