/**
 * Seed script: Populate education_videos table with Philippine farming videos
 * Run with: node db/seeds/seed_education_videos.js
 */

const db = require('../../db');
const videos = require('./education_videos_philippine_farming');

async function seedEducationVideos() {
  try {
    console.log('Seeding education_videos table with Philippine farming videos...');
    
    let inserted = 0;
    
    for (const video of videos) {
      try {
        await db('education_videos').insert({
          video_id: video.video_id,
          title: video.title,
          description: video.description,
          duration: video.duration,
          category: video.category,
          channel: video.channel,
          youtube_link: video.youtube_link
        });
        inserted++;
        console.log(`  ✅ Inserted: ${video.title.substring(0, 50)}...`);
      } catch (err) {
        if (err.code === '23505') { // Unique violation
          console.log(`  ⚠️  Skipped (duplicate): ${video.video_id}`);
        } else {
          console.error(`  ❌ Error inserting ${video.video_id}:`, err.message);
        }
      }
    }
    
    console.log(`\n✅ Seeded ${inserted} education videos successfully`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding education videos:', err.message);
    process.exit(1);
  }
}

seedEducationVideos();
