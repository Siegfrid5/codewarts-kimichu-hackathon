import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, CloudRain, Smartphone, Sprout } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="container animate-fade-in">
      <header style={{ textAlign: 'center', margin: '4rem 0 6rem 0' }}>
        <h1 style={{ fontSize: '4rem', marginBottom: '1.5rem', fontWeight: 800 }}>
          <span className="text-gradient">Protect Your Harvest.</span>
          <br /> Empower Your Farm.
        </h1>
        <p className="text-muted" style={{ fontSize: '1.25rem', maxWidth: '600px', margin: '0 auto 2rem auto' }}>
          GABAYANI uses satellite imagery, localized weather, and AI to predict crop risks before they destroy your livelihood. Sent straight to your phone via SMS.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Link to="/register" className="btn btn-primary" style={{ fontSize: '1.1rem', padding: '1rem 2rem' }}>
            Start Monitoring for Free
          </Link>
          <a href="#features" className="btn btn-secondary" style={{ fontSize: '1.1rem', padding: '1rem 2rem' }}>
            Learn More
          </a>
        </div>
      </header>

      <section id="features" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '6rem' }}>
        <div className="glass-card" style={{ padding: '2rem' }}>
          <CloudRain size={40} color="var(--accent-secondary)" style={{ marginBottom: '1rem' }} />
          <h3>Micro-Climate Weather</h3>
          <p className="text-muted">High-resolution hourly weather data tailored specifically to your municipality's centroid.</p>
        </div>
        <div className="glass-card" style={{ padding: '2rem' }}>
          <ShieldAlert size={40} color="var(--danger)" style={{ marginBottom: '1rem' }} />
          <h3>Predictive Risk Engine</h3>
          <p className="text-muted">Scientific GDD accumulation models to predict Brown Planthopper, Rice Blast, and Floods.</p>
        </div>
        <div className="glass-card" style={{ padding: '2rem' }}>
          <Smartphone size={40} color="var(--accent-primary)" style={{ marginBottom: '1rem' }} />
          <h3>SMS-First Delivery</h3>
          <p className="text-muted">No internet required in the field. Receive critical alerts and daily digests via SMS in your local dialect.</p>
        </div>
        <div className="glass-card" style={{ padding: '2rem' }}>
          <Sprout size={40} color="var(--warning)" style={{ marginBottom: '1rem' }} />
          <h3>AI Agronomist</h3>
          <p className="text-muted">Chat with our Gemini-powered consultant that knows your farm's specific risks and weather.</p>
        </div>
      </section>
    </div>
  );
}
