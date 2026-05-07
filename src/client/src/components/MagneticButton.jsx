import { forwardRef } from 'react';

const MagneticButton = forwardRef(({ 
  children, 
  variant = 'primary', 
  size = 'md',
  className = '',
  ...props 
}, ref) => {
  const baseStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    padding: size === 'lg' ? '1rem 2rem' : size === 'sm' ? '0.5rem 1rem' : '0.75rem 1.5rem',
    borderRadius: '8px',
    fontFamily: 'inherit',
    fontWeight: 500,
    fontSize: size === 'lg' ? '1.125rem' : size === 'sm' ? '0.875rem' : '1rem',
    cursor: 'pointer',
    transition: 'all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    border: 'none',
    textDecoration: 'none',
    transform: 'scale(1)'
  };

  const variants = {
    primary: {
      background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-primary-hover))',
      color: 'white',
      boxShadow: '0 4px 14px 0 var(--border-glow)',
      '&:hover': {
        transform: 'scale(1.03)',
        boxShadow: '0 6px 20px 0 rgba(16, 185, 129, 0.4)'
      }
    },
    secondary: {
      background: 'rgba(255, 255, 255, 0.05)',
      color: 'var(--text-primary)',
      border: '1px solid var(--border-glass)',
      '&:hover': {
        background: 'rgba(255, 255, 255, 0.1)',
        transform: 'scale(1.03)'
      }
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text-primary)',
      border: '1px solid var(--border-glass)',
      '&:hover': {
        background: 'var(--border-glass)',
        transform: 'scale(1.02)'
      }
    }
  };

  const variantStyles = variants[variant];

  const handleMouseEnter = (e) => {
    e.target.style.transform = variant === 'primary' ? 'scale(1.03)' : 'scale(1.02)';
  };

  const handleMouseLeave = (e) => {
    e.target.style.transform = 'scale(1)';
  };

  return (
    <button
      ref={ref}
      className={className}
      style={{
        ...baseStyles,
        background: variantStyles.background,
        color: variantStyles.color,
        border: variantStyles.border,
        boxShadow: variantStyles.boxShadow
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {children}
    </button>
  );
});

MagneticButton.displayName = 'MagneticButton';

export default MagneticButton;
