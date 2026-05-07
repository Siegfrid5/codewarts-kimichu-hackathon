import { useState, useEffect } from 'react';
import YouTubeEmbed from '../components/YouTubeEmbed';
import { useLanguage } from '../contexts/LanguageContext';
import { en } from '../translations/en';
import { tl } from '../translations/tl';
import { Search, BookOpen } from 'lucide-react';

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
    <div style={{ minHeight: 'calc(100vh - 64px)' }}>
      {/* Hero header — green band */}
      <section style={{
        background: 'var(--primary)',
        color: 'var(--on-primary)',
        padding: '64px 24px 80px',
        textAlign: 'center',
        position: 'relative'
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: 'var(--rounded-full)',
          background: 'rgba(255,255,255,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px'
        }}>
          <BookOpen size={32} color="white" />
        </div>
        <h1 style={{
          fontSize: 'clamp(28px, 5vw, 40px)',
          fontWeight: 700,
          marginBottom: '12px',
          letterSpacing: '-0.5px',
          color: 'var(--on-primary)'
        }}>
          Farming Education Library
        </h1>
        <p style={{
          fontSize: '18px',
          maxWidth: '520px',
          margin: '0 auto',
          opacity: 0.85,
          lineHeight: 1.6
        }}>
          Learn sustainable farming practices through our curated video library. From basics to advanced techniques.
        </p>

        {/* Wave at bottom */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          lineHeight: 0,
          overflow: 'hidden'
        }}>
          <svg viewBox="0 0 1440 40" preserveAspectRatio="none" style={{ width: '100%', height: '40px', display: 'block' }}>
            <path d="M0,0 C480,40 960,0 1440,40 L1440,40 L0,40 Z" fill="var(--canvas)" />
          </svg>
        </div>
      </section>

      <div className="container" style={{ padding: '32px 24px 64px' }}>
        {/* Search and Filter — pill-style */}
        <div style={{ 
          display: 'flex', 
          gap: '12px', 
          marginBottom: '40px',
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}>
          {/* Search bar */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center',
            gap: '10px',
            background: 'var(--surface-1)',
            border: '2px solid transparent',
            borderRadius: 'var(--rounded-pill)',
            padding: '12px 20px',
            flex: '1',
            maxWidth: '420px',
            transition: 'all 0.25s ease'
          }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--primary)';
              e.currentTarget.style.background = 'var(--canvas)';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(43,122,61,0.12)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'transparent';
              e.currentTarget.style.background = 'var(--surface-1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <Search size={18} color="var(--ink-subtle)" />
            <input
              type="text"
              placeholder="Search videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: '16px',
                color: 'var(--ink)',
                width: '100%',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontWeight: 400
              }}
            />
          </div>
          
          {/* Category filter — pill tabs */}
          <div style={{ 
            display: 'flex',
            gap: '6px',
            alignItems: 'center',
            flexWrap: 'wrap',
            justifyContent: 'center'
          }}>
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                style={{
                  padding: '10px 20px',
                  borderRadius: 'var(--rounded-pill)',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: selectedCategory === category ? 600 : 400,
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  color: selectedCategory === category ? 'var(--on-primary)' : 'var(--ink-muted)',
                  background: selectedCategory === category ? 'var(--primary)' : 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  minHeight: '40px'
                }}
                onMouseEnter={(e) => {
                  if (selectedCategory !== category) {
                    e.target.style.background = 'var(--surface-2)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedCategory !== category) {
                    e.target.style.background = 'transparent';
                  }
                }}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div style={{ 
            textAlign: 'center', 
            padding: '64px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              border: '4px solid var(--primary-light)',
              borderTopColor: 'var(--primary)',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite'
            }} />
            <p style={{ color: 'var(--ink-muted)', fontWeight: 500 }}>Loading videos...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div style={{ 
            textAlign: 'center', 
            padding: '64px',
            color: 'var(--semantic-error)',
            fontWeight: 500
          }}>
            <p>{error}</p>
          </div>
        )}

        {/* Video Grid */}
        {!loading && !error && (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
            gap: '24px' 
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
            padding: '64px 32px',
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: 'var(--rounded-full)',
              background: 'var(--surface-2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px'
            }}>
              <Search size={32} color="var(--ink-subtle)" />
            </div>
            <p style={{ 
              color: 'var(--ink-muted)',
              fontSize: '16px',
              fontWeight: 500
            }}>
              No videos found matching your search.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
