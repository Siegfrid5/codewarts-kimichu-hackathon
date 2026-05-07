import { forwardRef, useState } from 'react';

const FeatureCard = forwardRef(({ icon, title, description, delay = 0 }, ref) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      ref={ref}
      style={{
        background: 'var(--canvas)',
        border: '1px solid var(--hairline)',
        borderRadius: 'var(--rounded-xl)',
        padding: '32px',
        transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isHovered ? 'translateY(-6px)' : 'translateY(0)',
        boxShadow: isHovered ? 'var(--shadow-lift)' : 'var(--shadow-float)',
        opacity: 0,
        animation: `fadeInUp 0.6s ease forwards ${delay}s`,
        cursor: 'default',
        position: 'relative',
        overflow: 'hidden'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Animated leaf-blob accent behind the icon */}
      <div
        style={{
          position: 'absolute',
          top: '-20px',
          right: '-20px',
          width: '120px',
          height: '120px',
          background: 'var(--primary-light)',
          borderRadius: '50%',
          transition: 'all 0.4s ease',
          transform: isHovered ? 'scale(1.4)' : 'scale(1)',
          opacity: isHovered ? 0.5 : 0.25,
          pointerEvents: 'none'
        }}
      />

      {/* Icon container */}
      {icon && (
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: 'var(--rounded-lg)',
            background: 'var(--primary-pale)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px',
            transition: 'all 0.3s ease',
            transform: isHovered ? 'scale(1.08)' : 'scale(1)',
            position: 'relative',
            zIndex: 1
          }}
        >
          {icon}
        </div>
      )}

      <h3
        style={{
          fontSize: '22px',
          fontWeight: 700,
          lineHeight: 1.30,
          letterSpacing: '-0.2px',
          marginBottom: '12px',
          color: 'var(--ink)',
          transition: 'all 0.3s ease',
          position: 'relative',
          zIndex: 1
        }}
      >
        {title}
      </h3>

      <p
        style={{
          fontSize: '16px',
          lineHeight: 1.6,
          color: 'var(--ink-muted)',
          transition: 'all 0.3s ease',
          position: 'relative',
          zIndex: 1,
          marginBottom: 0
        }}
      >
        {description}
      </p>

      {/* Bottom accent line */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: isHovered ? '0' : '50%',
          right: isHovered ? '0' : '50%',
          height: '3px',
          background: 'var(--primary)',
          borderRadius: '3px 3px 0 0',
          transition: 'all 0.35s ease',
          opacity: isHovered ? 1 : 0
        }}
      />
    </div>
  );
});

FeatureCard.displayName = 'FeatureCard';

export default FeatureCard;
