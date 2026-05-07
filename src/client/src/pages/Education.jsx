import { useState, useEffect } from 'react';
import YouTubeEmbed from '../components/YouTubeEmbed';
import { useLanguage } from '../contexts/LanguageContext';
import { en } from '../translations/en';
import { tl } from '../translations/tl';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function Education() {
  const { language } = useLanguage();
  const translations = language === 'en' ? en : tl;
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [videos, setVideos] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/education/categories`);
        const data = await response.json();
        if (data.success) {
          setCategories(data.data);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    fetchCategories();
  }, []);

  // Fetch videos on mount or when category/search changes
  useEffect(() => {
    const fetchVideos = async () => {
      setLoading(true);
      setError(null);
      try {
        let url = `${API_BASE_URL}/api/education/videos`;
        
        if (searchQuery) {
          url = `${API_BASE_URL}/api/education/videos/search?q=${encodeURIComponent(searchQuery)}`;
          if (selectedCategory !== 'All') {
            url += `&category=${encodeURIComponent(selectedCategory)}`;
          }
        } else if (selectedCategory !== 'All') {
          url += `?category=${encodeURIComponent(selectedCategory)}`;
        }

        const response = await fetch(url);
        const data = await response.json();
        
        if (data.success) {
          setVideos(data.data);
        } else {
          setError('Failed to fetch videos');
        }
      } catch (err) {
        console.error('Error fetching videos:', err);
        setError('Failed to connect to server');
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, [selectedCategory, searchQuery]);

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

        {/* Loading State */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <p>Loading videos...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--danger)' }}>
            <p>{error}</p>
          </div>
        )}

        {/* Video Grid */}
        {!loading && !error && (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
            gap: '2rem' 
          }}>
            {videos.map((video) => (
              <YouTubeEmbed
                key={video.id}
                videoId={video.video_id}
                title={video.title}
                description={video.description}
                duration={video.duration}
                category={video.category}
              />
            ))}
          </div>
        )}

        {/* No Results */}
        {!loading && !error && videos.length === 0 && (
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
