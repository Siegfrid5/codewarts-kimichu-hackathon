import { forwardRef, useState, useEffect } from 'react';

const FeatureCard = forwardRef(({ icon, title, description, delay = 0 }, ref) => {
  const [isHovered, setIsHovered] = useState(false);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    // Subtle pulse animation every 3 seconds
    const interval = setInterval(() => {
      setPulse(true);
      setTimeout(() => setPulse(false), 1000);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      ref={ref}
      style={{
        background: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(8px)',
        border: '1px solid var(--border-glass)',
        borderRadius: '16px',
        padding: '2rem',
        transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        transform: 'translateY(0)',
        opacity: 0,
        animation: `fadeInUp 0.6s ease forwards ${delay}s`,
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Animated background glow on hover */}
      <div
        style={{
          position: 'absolute',
          top: -50,
          right: -50,
          width: 200,
          height: 200,
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, transparent 70%)',
          borderRadius: '50%',
          transition: 'all 0.4s ease',
          transform: isHovered ? 'scale(1.5)' : 'scale(0)',
          opacity: isHovered ? 1 : 0,
          pointerEvents: 'none'
        }}
      />

      {/* Icon container with pulse effect */}
      {icon && (
        <div 
          style={{
            marginBottom: '1.5rem',
            transition: 'all 0.3s ease',
            transform: isHovered ? 'scale(1.1)' : 'scale(1)',
            opacity: pulse ? 0.7 : 1
          }}
        >
          {icon}
        </div>
      )}

      <h3 
        style={{ 
          fontSize: '1.25rem', 
          marginBottom: '0.75rem', 
          fontWeight: 600,
          color: 'var(--text-primary)',
          transition: 'all 0.3s ease',
          transform: isHovered ? 'translateX(4px)' : 'translateX(0)'
        }}
      >
        {title}
      </h3>
      
      <p 
        className="text-muted" 
        style={{ 
          lineHeight: 1.6,
          transition: 'all 0.3s ease',
          opacity: isHovered ? 0.95 : 0.85
        }}
      >
        {description}
      </p>

      {/* Interactive indicator */}
      <div
        style={{
          position: 'absolute',
          bottom: '1rem',
          right: '1rem',
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: 'var(--accent-primary)',
          opacity: isHovered ? 1 : 0.3,
          transition: 'all 0.3s ease',
          boxShadow: isHovered ? '0 0 12px rgba(16, 185, 129, 0.4)' : 'none'
        }}
      />
    </div>
  );
});

FeatureCard.displayName = 'FeatureCard';

export default FeatureCard;
