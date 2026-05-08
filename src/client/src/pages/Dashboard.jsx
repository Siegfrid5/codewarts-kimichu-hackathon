import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { GoogleMap, useJsApiLoader, Polygon } from '@react-google-maps/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const libraries = ['geometry'];
const defaultCenter = { lat: 15.4829, lng: 120.9735 }; // Central Luzon area

export default function Dashboard() {
  const { apiCall, user } = useAuth();
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  useEffect(() => {
    const fetchFarms = async () => {
      try {
        const response = await apiCall(`${API_BASE_URL}/api/farms/my-farms`);
        const data = await response.json();
        
        if (data.success) {
          // API returns { data: { farms: [...] } }
          const farmsData = data.data?.farms || [];
          setFarms(Array.isArray(farmsData) ? farmsData : []);
        } else {
          setError('Failed to fetch farm data');
          setFarms([]);
        }
      } catch (err) {
        console.error('Error fetching farms:', err);
        setError('Failed to connect to server');
        setFarms([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFarms();
  }, [apiCall]);

  const getRiskBadge = (level) => {
    if (level === 'high') return <span className="badge badge-danger">High Risk</span>;
    if (level === 'moderate') return <span className="badge badge-warning">Moderate</span>;
    return <span className="badge badge-safe">Low Risk</span>;
  };

  const getOverallRisk = (farm) => {
    return farm.risk_status?.flood_risk === 'high' || 
           farm.risk_status?.bph_risk === 'high' || 
           farm.risk_status?.blast_risk === 'high';
  };

  if (loading) {
    return (
      <div className="container" style={{ 
        textAlign: 'center', 
        paddingTop: '96px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid var(--primary-light)',
          borderTopColor: 'var(--primary)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <p style={{ color: 'var(--ink-muted)', fontWeight: 500 }}>Loading farm data...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container" style={{ paddingTop: '96px' }}>
        <div style={{
          background: '#FDECEA',
          border: '1px solid rgba(231,76,60,0.2)',
          borderRadius: 'var(--rounded-md)',
          padding: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          color: 'var(--semantic-error)',
          fontWeight: 600,
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          <AlertTriangle size={20} />
          {error}
        </div>
      </div>
    );
  }

  if (farms.length === 0) {
    return (
      <div className="container" style={{ paddingTop: '96px', textAlign: 'center' }}>
        <div style={{
          background: 'var(--surface-1)',
          borderRadius: 'var(--rounded-xl)',
          padding: '64px 32px',
          maxWidth: '500px',
          margin: '0 auto'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: 'var(--rounded-full)',
            background: 'var(--primary-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px'
          }}>
            <span style={{ fontSize: '36px' }}>🌾</span>
          </div>
          <h3 style={{ marginBottom: '8px' }}>No farms registered yet</h3>
          <p style={{ color: 'var(--ink-muted)', marginBottom: '24px' }}>Register your first farm to get started.</p>
          <a href="/register" className="btn btn-primary" style={{ textDecoration: 'none' }}>Register Farm</a>
        </div>
      </div>
    );
  }

  return (
    <div className="container animate-fade-in" style={{ paddingTop: '32px', paddingBottom: '48px' }}>
      {/* Page header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '32px' 
      }}>
        <div>
          <span className="eyebrow" style={{ marginBottom: '4px', display: 'block' }}>Dashboard</span>
          <h2 style={{ margin: 0 }}>My Farms Overview</h2>
        </div>
        <button className="btn btn-secondary" style={{ 
          padding: '10px 20px',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span style={{ fontSize: '16px' }}>🔄</span>
          Refresh Data
        </button>
      </div>

      {/* Map container — DESIGN.md map-container */}
      <div style={{ 
        height: '400px', 
        width: '100%', 
        borderRadius: 'var(--rounded-xl)', 
        overflow: 'hidden', 
        boxShadow: 'var(--shadow-float)',
        background: 'var(--surface-1)',
        marginBottom: '32px' 
      }}>
        {loadError ? (
          <div style={{ 
            padding: '32px', 
            textAlign: 'center', 
            color: 'var(--semantic-error)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            gap: '8px'
          }}>
            <AlertTriangle size={20} />
            Error loading maps. Check console or API key.
          </div>
        ) : !isLoaded ? (
          <div style={{ 
            padding: '32px', 
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: 'var(--ink-muted)'
          }}>Loading Satellite Map...</div>
        ) : (
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '100%' }}
            center={farms.length > 0 && farms[0].centroid_lat ? { lat: parseFloat(farms[0].centroid_lat), lng: parseFloat(farms[0].centroid_lng) } : defaultCenter}
            zoom={farms.length > 0 ? 15 : 10}
            mapTypeId="satellite"
            options={{ disableDefaultUI: true, zoomControl: true, mapTypeId: 'satellite' }}
          >
            {farms.map((farm) => {
              if (!farm.polygon_geojson || !farm.polygon_geojson.coordinates || !farm.polygon_geojson.coordinates[0]) return null;
              
              // GeoJSON coordinates are [lng, lat], Google Maps expects {lat, lng}
              const paths = farm.polygon_geojson.coordinates[0].map(coord => ({
                lat: coord[1],
                lng: coord[0]
              }));
              
              return (
                <Polygon
                  key={farm.id}
                  path={paths}
                  options={{
                    fillColor: '#2B7A3D',
                    fillOpacity: 0.4,
                    strokeWeight: 2,
                    strokeColor: '#1B5E2B',
                    clickable: false
                  }}
                />
              );
            })}
          </GoogleMap>
        )}
      </div>

      {/* Farm Cards */}
      {farms.map((farm) => (
        <div key={farm.id} style={{ 
          background: 'var(--canvas)',
          border: '1px solid var(--hairline)',
          borderRadius: 'var(--rounded-xl)', 
          padding: '32px', 
          marginBottom: '24px',
          boxShadow: 'var(--shadow-float)',
          animation: 'fadeIn 0.4s ease'
        }}>
          {/* Farm header */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-start',
            paddingBottom: '24px', 
            marginBottom: '24px',
            borderBottom: '1px solid var(--hairline)'
          }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '22px' }}>
                {farm.municipality} Farm
              </h3>
              <p style={{ 
                color: 'var(--ink-muted)', 
                marginTop: '4px',
                fontSize: '14px',
                fontWeight: 500 
              }}>
                {farm.crop} • {farm.area} hectares
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ 
                fontSize: '12px', 
                fontWeight: 700,
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                color: 'var(--ink-subtle)',
                marginBottom: '8px' 
              }}>Overall Status</p>
              {getOverallRisk(farm)
                ? <span className="badge badge-danger" style={{ fontSize: '13px', padding: '6px 16px', fontWeight: 700 }}>CRITICAL ALERT</span>
                : <span className="badge badge-safe" style={{ fontSize: '13px', padding: '6px 16px', fontWeight: 700 }}>ALL CLEAR</span>
              }
            </div>
          </div>

          {/* Weather stat cards — Ecosia counter pattern */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
            gap: '16px' 
          }}>
            <div style={{
              background: 'var(--surface-1)',
              borderRadius: 'var(--rounded-lg)',
              padding: '24px',
              border: '1px solid var(--hairline)',
              transition: 'all 0.25s ease'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                🌡️
                <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--ink-muted)' }}>Temperature</span>
              </div>
              <p className="stat-number" style={{ fontSize: '36px', margin: 0, color: 'var(--ink)' }}>
                {farm.weather?.temp_c ?? '--'}
                <span style={{ fontSize: '18px', fontWeight: 600, color: 'var(--ink-muted)' }}>°C</span>
              </p>
            </div>
            <div style={{
              background: 'var(--surface-1)',
              borderRadius: 'var(--rounded-lg)',
              padding: '24px',
              border: '1px solid var(--hairline)',
              transition: 'all 0.25s ease'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '16px' }}>💧</span>
                <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--ink-muted)' }}>Humidity</span>
              </div>
              <p className="stat-number" style={{ fontSize: '36px', margin: 0, color: 'var(--ink)' }}>
                {farm.weather?.humidity_pct ?? '--'}
                <span style={{ fontSize: '18px', fontWeight: 600, color: 'var(--ink-muted)' }}>%</span>
              </p>
            </div>
            <div style={{
              background: 'var(--surface-1)',
              borderRadius: 'var(--rounded-lg)',
              padding: '24px',
              border: '1px solid var(--hairline)',
              transition: 'all 0.25s ease'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '16px' }}>🌧️</span>
                <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--ink-muted)' }}>Rain (1hr)</span>
              </div>
              <p className="stat-number" style={{ fontSize: '36px', margin: 0, color: 'var(--ink)' }}>
                {farm.weather?.rain_1h_mm ?? '--'}
                <span style={{ fontSize: '18px', fontWeight: 600, color: 'var(--ink-muted)' }}> mm</span>
              </p>
            </div>
          </div>

          {/* Risk factors */}
          <h4 style={{ 
            marginTop: '32px', 
            marginBottom: '16px',
            fontSize: '18px',
            fontWeight: 600
          }}>Pest & Disease Risk Factors</h4>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '12px' 
          }}>
            <div style={{ 
              padding: '16px 20px', 
              background: 'var(--surface-1)', 
              borderRadius: 'var(--rounded-md)', 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              border: '1px solid var(--hairline)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px' }}>🐛</span>
                <span style={{ fontWeight: 500, fontSize: '14px' }}>Brown Planthopper</span>
              </div>
              {getRiskBadge(farm.risk_status?.bph_risk)}
            </div>
            <div style={{ 
              padding: '16px 20px', 
              background: 'var(--surface-1)', 
              borderRadius: 'var(--rounded-md)', 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              border: '1px solid var(--hairline)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px' }}>💨</span>
                <span style={{ fontWeight: 500, fontSize: '14px' }}>Rice Blast</span>
              </div>
              {getRiskBadge(farm.risk_status?.blast_risk)}
            </div>
            <div style={{ 
              padding: '16px 20px', 
              background: 'var(--surface-1)', 
              borderRadius: 'var(--rounded-md)', 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              border: '1px solid var(--hairline)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px' }}>🌧️</span>
                <span style={{ fontWeight: 500, fontSize: '14px' }}>Flood Risk</span>
              </div>
              {getRiskBadge(farm.risk_status?.flood_risk)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
