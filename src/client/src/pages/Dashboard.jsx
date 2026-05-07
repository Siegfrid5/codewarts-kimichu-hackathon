import React, { useState, useEffect } from 'react';
import { Activity, Wind, Droplets, Thermometer, MapPin } from 'lucide-react';

export default function Dashboard() {
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);

  // In a real app, this would fetch from GET /api/farms/my-farms
  // We're mocking it here for the initial frontend display
  useEffect(() => {
    setTimeout(() => {
      setFarms([
        {
          id: '1',
          name: 'Tomasino Farmer',
          municipality: 'Manila',
          crop: 'Rice',
          area: 21.5,
          weather: { temp: 28.5, humidity: 92, rain_1h: 20 },
          risks: { bph: 'low', blast: 'low', flood: 'moderate' }
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const getRiskBadge = (level) => {
    if (level === 'high') return <span className="badge badge-danger">High Risk</span>;
    if (level === 'moderate') return <span className="badge badge-warning">Moderate</span>;
    return <span className="badge badge-safe">Low Risk</span>;
  };

  if (loading) {
    return <div className="container" style={{ textAlign: 'center', marginTop: '4rem' }}>Loading farm data...</div>;
  }

  return (
    <div className="container animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>My Farms Overview</h2>
        <button className="btn btn-secondary">
          <Activity size={18} /> Refresh Data
        </button>
      </div>

      {farms.map((farm) => (
        <div key={farm.id} className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-glass)', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
            <div>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MapPin size={24} color="var(--accent-primary)" />
                {farm.municipality} Farm
              </h3>
              <p className="text-muted" style={{ marginTop: '0.25rem' }}>{farm.crop} • {farm.area} hectares</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Overall Status</p>
              {farm.risks.flood === 'high' || farm.risks.bph === 'high' || farm.risks.blast === 'high' 
                ? <span className="badge badge-danger" style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>CRITICAL ALERT</span>
                : <span className="badge badge-safe" style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>ALL CLEAR</span>
              }
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <h4 className="text-muted" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Thermometer size={18} /> Temperature
              </h4>
              <p style={{ fontSize: '1.5rem', fontWeight: 600 }}>{farm.weather.temp}°C</p>
            </div>
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <h4 className="text-muted" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Droplets size={18} /> Humidity
              </h4>
              <p style={{ fontSize: '1.5rem', fontWeight: 600 }}>{farm.weather.humidity}%</p>
            </div>
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <h4 className="text-muted" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Wind size={18} /> Rain (1hr)
              </h4>
              <p style={{ fontSize: '1.5rem', fontWeight: 600 }}>{farm.weather.rain_1h} mm</p>
            </div>
          </div>

          <h4 style={{ marginTop: '2rem', marginBottom: '1rem' }}>Pest & Disease Risk Factors</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between' }}>
              <span>Brown Planthopper</span>
              {getRiskBadge(farm.risks.bph)}
            </div>
            <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between' }}>
              <span>Rice Blast</span>
              {getRiskBadge(farm.risks.blast)}
            </div>
            <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between' }}>
              <span>Flood Risk</span>
              {getRiskBadge(farm.risks.flood)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
