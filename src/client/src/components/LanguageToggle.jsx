import { useLanguage } from '../contexts/LanguageContext';

const LanguageToggle = () => {
  const { language, toggleLanguage } = useLanguage();

  return (
    <button
      onClick={toggleLanguage}
      style={{
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid var(--border-glass)',
        borderRadius: '8px',
        padding: '0.5rem 1rem',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        transition: 'all 0.2s ease',
        transform: 'scale(1)',
        fontSize: '0.875rem'
      }}
      onMouseEnter={(e) => {
        e.target.style.background = 'rgba(255, 255, 255, 0.1)';
        e.target.style.transform = 'scale(1.02)';
      }}
      onMouseLeave={(e) => {
        e.target.style.background = 'rgba(255, 255, 255, 0.05)';
        e.target.style.transform = 'scale(1)';
      }}
    >
      <span>🌐</span>
      <span>{language === 'en' ? 'EN' : 'TL'}</span>
    </button>
  );
};

export default LanguageToggle;
