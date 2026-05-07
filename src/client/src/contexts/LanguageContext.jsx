import { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    // Load language preference from localStorage
    const savedLanguage = localStorage.getItem('gabayani-language');
    if (savedLanguage) {
      setLanguage(savedLanguage);
    }
  }, []);

  const toggleLanguage = () => {
    const newLanguage = language === 'en' ? 'tl' : 'en';
    setLanguage(newLanguage);
    localStorage.setItem('gabayani-language', newLanguage);
  };

  const setLanguageDirect = (lang) => {
    setLanguage(lang);
    localStorage.setItem('gabayani-language', lang);
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, setLanguageDirect }}>
      {children}
    </LanguageContext.Provider>
  );
};
