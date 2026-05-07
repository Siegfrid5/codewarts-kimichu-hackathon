import { Link } from 'react-router-dom';
import NoiseTexture from '../components/NoiseTexture';
import MagneticButton from '../components/MagneticButton';
import FeatureCard from '../components/FeatureCard';
import { useEffect, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { en } from '../translations/en';
import { tl } from '../translations/tl';
import { gsap } from 'gsap';

export default function LandingPage() {
  const { language } = useLanguage();
  const translations = language === 'en' ? en : tl;
  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const heroTitleRef = useRef(null);
  const heroDescRef = useRef(null);
  const heroButtonsRef = useRef(null);

  useEffect(() => {
    // GSAP hero entrance animation
    if (heroTitleRef.current && heroDescRef.current && heroButtonsRef.current) {
      gsap.fromTo(heroTitleRef.current,
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 1, ease: 'power3.out', delay: 0.2 }
      );
      gsap.fromTo(heroDescRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 1, ease: 'power3.out', delay: 0.4 }
      );
      gsap.fromTo(heroButtonsRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', delay: 0.6 }
      );
    }
  }, []);

  return (
    <>
      <NoiseTexture />
      <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden', paddingTop: '6rem' }}>
        {/* Hero Section - The Opening Shot */}
        <div 
          ref={heroRef}
          style={{
            height: '100dvh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            padding: '2rem',
            position: 'relative',
            background: 'rgba(255, 255, 255, 0.95)'
          }}
        >
          <div style={{ maxWidth: '800px', zIndex: 1, paddingLeft: '5%' }}>
            <h1 
              ref={heroTitleRef}
              style={{ 
                fontSize: 'clamp(3rem, 10vw, 6rem)', 
                marginBottom: '1.5rem', 
                fontWeight: 800,
                lineHeight: 1.05,
                letterSpacing: '-0.03em',
                color: 'var(--accent-primary)'
              }}
            >
              {translations.landing.hero.title}
              <br /> {translations.landing.hero.subtitle}
            </h1>
            <p 
              ref={heroDescRef}
              className="text-muted" 
              style={{ 
                fontSize: 'clamp(1.125rem, 2.5vw, 1.5rem)', 
                maxWidth: '600px', 
                margin: '0 auto 3rem 0',
                lineHeight: 1.6,
                opacity: 0.85
              }}
            >
              {translations.landing.hero.description}
            </p>
            <div ref={heroButtonsRef} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <Link to="/register">
                <MagneticButton variant="primary" size="lg">
                  {translations.landing.hero.ctaPrimary}
                </MagneticButton>
              </Link>
              <a href="#features">
                <MagneticButton variant="secondary" size="lg">
                  {translations.landing.hero.ctaSecondary}
                </MagneticButton>
              </a>
            </div>
          </div>
        </div>

        {/* Features Section - Interactive Functional Artifacts */}
        <section 
          ref={featuresRef}
          id="features" 
          style={{ 
            padding: '6rem 2rem',
            maxWidth: '1200px',
            margin: '0 auto'
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', marginBottom: '1rem', fontWeight: 700 }}>
              {translations.landing.features.title}
            </h2>
            <p className="text-muted" style={{ fontSize: '1.15rem', maxWidth: '600px', margin: '0 auto' }}>
              {translations.landing.features.description}
            </p>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
            gap: '2rem' 
          }}>
            <FeatureCard 
              delay={0.1}
              title={translations.landing.features.weather.title}
              description={translations.landing.features.weather.description}
            />
            <FeatureCard 
              delay={0.2}
              title={translations.landing.features.risk.title}
              description={translations.landing.features.risk.description}
            />
            <FeatureCard 
              delay={0.3}
              title={translations.landing.features.sms.title}
              description={translations.landing.features.sms.description}
            />
            <FeatureCard
              delay={0.4}
              title={translations.landing.features.ai.title}
              description={translations.landing.features.ai.description}
            />
          </div>
        </section>
      </div>

      {/* Add animation keyframes */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}
