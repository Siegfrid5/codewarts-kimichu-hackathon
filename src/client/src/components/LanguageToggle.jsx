import { useLanguage } from '../contexts/LanguageContext';
import { Globe } from 'lucide-react';

const LanguageToggle = () => {
  const { language, toggleLanguage } = useLanguage();

  return (
    <button
      onClick={toggleLanguage}
      style={{
        background: 'var(--surface-1)',
        border: '1px solid var(--hairline)',
        borderRadius: 'var(--rounded-pill)',
        padding: '8px 16px',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        transition: 'all 0.25s ease',
        fontSize: '13px',
        fontWeight: 600,
        fontFamily: 'Plus Jakarta Sans, sans-serif',
        color: 'var(--ink)',
        minHeight: '36px',
        letterSpacing: '0.3px',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--primary-pale)';
        e.currentTarget.style.borderColor = 'var(--primary)';
        e.currentTarget.style.color = 'var(--primary)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'var(--surface-1)';
        e.currentTarget.style.borderColor = 'var(--hairline)';
        e.currentTarget.style.color = 'var(--ink)';
      }}
      aria-label="Toggle language"
    >
      <Globe size={14} strokeWidth={2.5} />
      <span>{language === 'en' ? 'EN' : 'TL'}</span>
    </button>
  );
};

export default LanguageToggle;
