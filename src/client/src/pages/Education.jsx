import { useState } from 'react';
import YouTubeEmbed from '../components/YouTubeEmbed';
import { useLanguage } from '../contexts/LanguageContext';
import { en } from '../translations/en';
import { tl } from '../translations/tl';

const educationVideos = [
  {
    id: 'video1',
    videoId: 'dQw4w9WgXcQ',
    title: 'Rice Planting Basics for Beginners',
    description: 'Learn the fundamentals of rice planting including seed selection, soil preparation, and proper spacing techniques.',
    duration: '12:34',
    category: 'Basics'
  },
  {
    id: 'video2',
    videoId: 'dQw4w9WgXcQ',
    title: 'Pest Management in Organic Farming',
    description: 'Natural methods to control common rice pests without harmful chemicals, protecting both crops and environment.',
    duration: '18:45',
    category: 'Pest Control'
  },
  {
    id: 'video3',
    videoId: 'dQw4w9WgXcQ',
    title: 'Water Management for Rice Fields',
    description: 'Essential irrigation techniques to optimize water usage and ensure healthy crop growth throughout the season.',
    duration: '15:20',
    category: 'Irrigation'
  },
  {
    id: 'video4',
    videoId: 'dQw4w9WgXcQ',
    title: 'Harvesting and Post-Harvest Handling',
    description: 'Best practices for harvesting rice at the right time and proper storage to maintain grain quality.',
    duration: '10:15',
    category: 'Harvest'
  },
  {
    id: 'video5',
    videoId: 'dQw4w9WgXcQ',
    title: 'Understanding Soil Health',
    description: 'How to test and improve soil fertility using organic amendments and sustainable farming practices.',
    duration: '22:10',
    category: 'Soil Health'
  },
  {
    id: 'video6',
    videoId: 'dQw4w9WgXcQ',
    title: 'Modern Rice Varieties Selection',
    description: 'Choosing the right rice varieties for your region based on climate, soil type, and market demand.',
    duration: '14:30',
    category: 'Varieties'
  },
  {
    id: 'video7',
    videoId: 'dQw4w9WgXcQ',
    title: 'Fertilizer Application Guide',
    description: 'When and how to apply fertilizers for maximum yield while minimizing environmental impact.',
    duration: '16:45',
    category: 'Nutrients'
  },
  {
    id: 'video8',
    videoId: 'dQw4w9WgXcQ',
    title: 'Disease Prevention in Rice Crops',
    description: 'Identifying common rice diseases early and implementing preventive measures to protect your harvest.',
    duration: '19:20',
    category: 'Disease'
  }
];

const categories = ['All', 'Basics', 'Pest Control', 'Irrigation', 'Harvest', 'Soil Health', 'Varieties', 'Nutrients', 'Disease'];

export default function Education() {
  const { language } = useLanguage();
  const translations = language === 'en' ? en : tl;
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredVideos = educationVideos.filter(video => {
    const matchesCategory = selectedCategory === 'All' || video.category === selectedCategory;
    const matchesSearch = video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         video.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div style={{ minHeight: '100vh', padding: '8rem 2rem 4rem', position: 'relative', paddingTop: '8rem' }}>
      <div className="container">
        {/* Header */}
        <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 700, marginBottom: '1rem', color: 'var(--accent-primary)' }}>
            Farming Education Library
          </h1>
          <p className="text-muted" style={{ fontSize: '1.125rem', maxWidth: '600px', margin: '0 auto' }}>
            Learn sustainable farming practices through our curated video library. From basics to advanced techniques.
          </p>
        </div>

        {/* Search and Filter */}
        <div style={{ 
          display: 'flex', 
          gap: '1rem', 
          marginBottom: '2rem',
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(8px)',
            border: '1px solid var(--border-glass)',
            borderRadius: '12px',
            padding: '0.75rem 1rem',
            flex: '1',
            maxWidth: '400px'
          }}>
            <input
              type="text"
              placeholder="Search videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: '1rem',
                color: 'var(--text-primary)',
                width: '100%',
                fontFamily: 'inherit'
              }}
            />
          </div>
          
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(8px)',
            border: '1px solid var(--border-glass)',
            borderRadius: '12px',
            padding: '0.75rem 1rem'
          }}>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: '1rem',
                color: 'var(--text-primary)',
                fontFamily: 'inherit',
                cursor: 'pointer'
              }}
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Video Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
          gap: '2rem' 
        }}>
          {filteredVideos.map((video, index) => (
            <YouTubeEmbed
              key={video.id}
              videoId={video.videoId}
              title={video.title}
              description={video.description}
              duration={video.duration}
              category={video.category}
            />
          ))}
        </div>

        {filteredVideos.length === 0 && (
          <div style={{ 
            textAlign: 'center', 
            padding: '4rem',
            color: 'var(--text-secondary)'
          }}>
            <p>No videos found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
