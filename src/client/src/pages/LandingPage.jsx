import { Link } from 'react-router-dom';
import FeatureCard from '../components/FeatureCard';
import { useEffect, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { en } from '../translations/en';
import { tl } from '../translations/tl';
import { gsap } from 'gsap';
import { ArrowRight, CloudSun, ShieldAlert, MessageSquareText, BrainCircuit } from 'lucide-react';

export default function LandingPage() {
  const { language } = useLanguage();
  const translations = language === 'en' ? en : tl;
  const heroTitleRef = useRef(null);
  const heroDescRef = useRef(null);
  const heroButtonsRef = useRef(null);
  const heroStatRef = useRef(null);

  useEffect(() => {
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
    if (heroStatRef.current) {
      gsap.fromTo(heroStatRef.current,
        { opacity: 0, scale: 0.9 },
        { opacity: 1, scale: 1, duration: 0.8, ease: 'back.out(1.4)', delay: 0.8 }
      );
    }
  }, []);

  const featureIcons = [
    <CloudSun size={32} color="var(--primary)" strokeWidth={2} />,
    <ShieldAlert size={32} color="var(--primary)" strokeWidth={2} />,
    <MessageSquareText size={32} color="var(--primary)" strokeWidth={2} />,
    <BrainCircuit size={32} color="var(--primary)" strokeWidth={2} />
  ];

  return (
    <>
      {/* ──── HERO SECTION — Full-bleed green (Ecosia style) ──── */}
      <section style={{
        background: 'var(--primary)',
        color: 'var(--on-primary)',
        position: 'relative',
        overflow: 'hidden',
        padding: '80px 48px 120px',
        minHeight: '85vh',
        display: 'flex',
        alignItems: 'center'
      }}>
        {/* Decorative leaf blobs */}
        <div style={{
          position: 'absolute',
          top: '-100px',
          right: '-80px',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'var(--primary-dark)',
          opacity: 0.3,
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-60px',
          left: '-40px',
          width: '250px',
          height: '250px',
          borderRadius: '50%',
          background: 'var(--primary-dark)',
          opacity: 0.2,
          pointerEvents: 'none'
        }} />

        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          width: '100%',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '64px',
          alignItems: 'center',
          position: 'relative',
          zIndex: 1
        }}
          className="hero-grid"
        >
          {/* Left column — text */}
          <div>
            <div style={{
              display: 'inline-block',
              padding: '6px 16px',
              borderRadius: 'var(--rounded-pill)',
              background: 'rgba(255,255,255,0.15)',
              fontSize: '13px',
              fontWeight: 700,
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              marginBottom: '24px',
              backdropFilter: 'blur(4px)'
            }}>
              🌾 SMS-Based Farm Intelligence
            </div>
            <h1
              ref={heroTitleRef}
              style={{
                fontSize: 'clamp(36px, 6vw, 72px)',
                fontWeight: 800,
                lineHeight: 1.08,
                letterSpacing: '-1.5px',
                marginBottom: '24px',
                color: 'var(--on-primary)'
              }}
            >
              {translations.landing.hero.title}
              <br /> {translations.landing.hero.subtitle}
            </h1>
            <p
              ref={heroDescRef}
              style={{
                fontSize: 'clamp(16px, 2vw, 18px)',
                lineHeight: 1.6,
                maxWidth: '520px',
                marginBottom: '40px',
                opacity: 0.9
              }}
            >
              {translations.landing.hero.description}
            </p>
            <div ref={heroButtonsRef} style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <Link to="/register" style={{ textDecoration: 'none' }}>
                <button className="btn btn-accent" style={{
                  fontSize: '16px',
                  padding: '16px 32px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: 700
                }}>
                  {translations.landing.hero.ctaPrimary}
                  <ArrowRight size={18} />
                </button>
              </Link>
              <a href="#features" style={{ textDecoration: 'none' }}>
                <button style={{
                  padding: '16px 32px',
                  borderRadius: 'var(--rounded-pill)',
                  background: 'transparent',
                  border: '2px solid rgba(255,255,255,0.4)',
                  color: 'var(--on-primary)',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  minHeight: '48px'
                }}
                  onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
                  onMouseLeave={(e) => e.target.style.background = 'transparent'}
                >
                  {translations.landing.hero.ctaSecondary}
                </button>
              </a>
            </div>
          </div>

          {/* Right column — hero stat card (Ecosia counter pattern) */}
          <div ref={heroStatRef} style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            alignItems: 'center'
          }}
            className="hero-stat-area"
          >
            <div style={{
              background: 'rgba(255,255,255,0.12)',
              backdropFilter: 'blur(8px)',
              borderRadius: 'var(--rounded-xl)',
              padding: '48px 40px',
              width: '100%',
              maxWidth: '380px',
              textAlign: 'center',
              border: '1px solid rgba(255,255,255,0.15)'
            }}>
              <div style={{
                fontSize: '64px',
                fontWeight: 800,
                lineHeight: 1,
                letterSpacing: '-2px',
                marginBottom: '12px'
              }}>
                24/7
              </div>
              <div style={{
                fontSize: '14px',
                fontWeight: 500,
                letterSpacing: '0.5px',
                opacity: 0.8,
                textTransform: 'uppercase'
              }}>
                Farm monitoring via SMS
              </div>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              width: '100%',
              maxWidth: '380px'
            }}>
              <div style={{
                background: 'rgba(255,255,255,0.1)',
                borderRadius: 'var(--rounded-lg)',
                padding: '20px',
                textAlign: 'center',
                border: '1px solid rgba(255,255,255,0.1)'
              }}>
                <div style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-1px' }}>3</div>
                <div style={{ fontSize: '12px', fontWeight: 500, opacity: 0.7, marginTop: '4px' }}>Risk Models</div>
              </div>
              <div style={{
                background: 'rgba(255,255,255,0.1)',
                borderRadius: 'var(--rounded-lg)',
                padding: '20px',
                textAlign: 'center',
                border: '1px solid rgba(255,255,255,0.1)'
              }}>
                <div style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-1px' }}>4×</div>
                <div style={{ fontSize: '12px', fontWeight: 500, opacity: 0.7, marginTop: '4px' }}>Daily Updates</div>
              </div>
            </div>
          </div>
        </div>

        {/* SVG Wave Divider at bottom */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          lineHeight: 0,
          overflow: 'hidden'
        }}>
          <svg viewBox="0 0 1440 60" preserveAspectRatio="none" style={{ width: '100%', height: '60px', display: 'block' }}>
            <path d="M0,0 C360,60 1080,0 1440,60 L1440,60 L0,60 Z" fill="var(--canvas)" />
          </svg>
        </div>
      </section>

      {/* ──── FEATURES SECTION — alternating surface color ──── */}
      <section
        id="features"
        style={{
          padding: '96px 24px',
          background: 'var(--canvas)'
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <span className="eyebrow" style={{ marginBottom: '12px', display: 'block' }}>Features</span>
            <h2 style={{
              fontSize: 'clamp(28px, 5vw, 40px)',
              fontWeight: 700,
              marginBottom: '16px',
              letterSpacing: '-0.5px'
            }}>
              {translations.landing.features.title}
            </h2>
            <p style={{
              color: 'var(--ink-muted)',
              fontSize: '18px',
              maxWidth: '600px',
              margin: '0 auto',
              lineHeight: 1.6
            }}>
              {translations.landing.features.description}
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '24px'
          }}>
            <FeatureCard
              delay={0.1}
              icon={featureIcons[0]}
              title={translations.landing.features.weather.title}
              description={translations.landing.features.weather.description}
            />
            <FeatureCard
              delay={0.2}
              icon={featureIcons[1]}
              title={translations.landing.features.risk.title}
              description={translations.landing.features.risk.description}
            />
            <FeatureCard
              delay={0.3}
              icon={featureIcons[2]}
              title={translations.landing.features.sms.title}
              description={translations.landing.features.sms.description}
            />
            <FeatureCard
              delay={0.4}
              icon={featureIcons[3]}
              title={translations.landing.features.ai.title}
              description={translations.landing.features.ai.description}
            />
          </div>
        </div>
      </section>

      {/* ──── CTA BANNER — Ecosia "Join" section ──── */}
      <section style={{
        padding: '0 24px 96px',
        background: 'var(--canvas)'
      }}>
        <div style={{
          maxWidth: '1000px',
          margin: '0 auto',
          background: 'var(--primary)',
          color: 'var(--on-primary)',
          borderRadius: 'var(--rounded-xl)',
          padding: '64px 48px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Decorative blob */}
          <div style={{
            position: 'absolute',
            top: '-40px',
            right: '-30px',
            width: '180px',
            height: '180px',
            borderRadius: '50%',
            background: 'var(--primary-dark)',
            opacity: 0.3,
            pointerEvents: 'none'
          }} />
          <h2 style={{
            fontSize: 'clamp(24px, 4vw, 30px)',
            fontWeight: 700,
            marginBottom: '16px',
            position: 'relative',
            zIndex: 1,
            color: 'var(--on-primary)'
          }}>
            {language === 'en' ? 'Ready to protect your harvest?' : 'Handa ka na bang pangalagaan ang iyong ani?'}
          </h2>
          <p style={{
            fontSize: '18px',
            opacity: 0.9,
            marginBottom: '32px',
            maxWidth: '500px',
            margin: '0 auto 32px',
            lineHeight: 1.6,
            position: 'relative',
            zIndex: 1
          }}>
            {language === 'en'
              ? 'Register your farm today and start receiving SMS alerts for weather, pests, and crop health.'
              : 'Magrehistro ng iyong bukid ngayon at magsimulang tumanggap ng SMS alerts para sa panahon, peste, at kalusugan ng pananim.'
            }
          </p>
          <Link to="/register" style={{ textDecoration: 'none', position: 'relative', zIndex: 1 }}>
            <button className="btn btn-accent" style={{
              fontSize: '16px',
              padding: '16px 40px',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              {translations.landing.hero.ctaPrimary}
              <ArrowRight size={18} />
            </button>
          </Link>
        </div>
      </section>

      {/* Responsive hero grid */}
      <style>{`
        @media (max-width: 768px) {
          .hero-grid {
            grid-template-columns: 1fr !important;
            gap: 40px !important;
            text-align: center;
          }
          .hero-stat-area {
            align-items: center !important;
          }
          .hero-grid > div:first-child {
            padding-left: 0 !important;
          }
          .hero-grid > div:first-child p {
            margin-left: auto !important;
            margin-right: auto !important;
          }
          .hero-grid > div:first-child > div:last-child {
            justify-content: center !important;
          }
        }
      `}</style>
    </>
  );
}
