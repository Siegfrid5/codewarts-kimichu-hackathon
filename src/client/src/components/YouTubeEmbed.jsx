import { useState } from 'react';

const YouTubeEmbed = ({ videoId, title, description, duration, category }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div
      style={{
        background: 'var(--canvas)',
        border: '1px solid var(--hairline)',
        borderRadius: 'var(--rounded-xl)',
        overflow: 'hidden',
        transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'pointer',
        position: 'relative',
        boxShadow: 'var(--shadow-whisper)'
      }}
      onClick={() => !isPlaying && setIsPlaying(true)}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-6px)';
        e.currentTarget.style.boxShadow = 'var(--shadow-float)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'var(--shadow-whisper)';
      }}
    >
      <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, background: 'var(--inverse-canvas)' }}>
        {isPlaying ? (
          <iframe
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              border: 0
            }}
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <>
            <img
              src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
              alt={title}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
              onError={(e) => {
                e.target.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
              }}
            />
            {/* Play button */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '64px',
                height: '64px',
                background: 'var(--primary)',
                borderRadius: 'var(--rounded-full)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease',
                boxShadow: '0 8px 24px rgba(43,122,61,0.4)'
              }}
            >
              <span style={{ fontSize: '28px', color: 'white', marginLeft: '3px' }}>▶</span>
            </div>
            {/* Duration badge */}
            <div
              style={{
                position: 'absolute',
                bottom: '12px',
                right: '12px',
                background: 'rgba(27, 52, 33, 0.85)',
                color: 'white',
                padding: '4px 10px',
                borderRadius: 'var(--rounded-sm)',
                fontSize: '12px',
                fontWeight: 600,
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontVariantNumeric: 'tabular-nums'
              }}
            >
              {duration}
            </div>
          </>
        )}
      </div>
      {/* Card content */}
      <div style={{ padding: '20px 24px 24px' }}>
        {/* Category badge */}
        <div style={{ marginBottom: '10px' }}>
          <span className="badge badge-safe" style={{
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            {category}
          </span>
        </div>
        <h3 style={{ 
          fontSize: '18px', 
          fontWeight: 700, 
          marginBottom: '8px', 
          color: 'var(--ink)',
          lineHeight: 1.3,
          letterSpacing: '-0.2px'
        }}>
          {title}
        </h3>
        <p style={{ 
          fontSize: '14px', 
          lineHeight: 1.6,
          color: 'var(--ink-muted)',
          margin: 0
        }}>
          {description}
        </p>
      </div>
    </div>
  );
};

export default YouTubeEmbed;
