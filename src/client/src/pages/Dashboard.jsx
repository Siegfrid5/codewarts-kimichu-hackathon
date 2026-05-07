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

  if (loading) {
    return <div className="container" style={{ textAlign: 'center', marginTop: '4rem' }}>Loading farm data...</div>;
  }

  if (error) {
    return <div className="container" style={{ textAlign: 'center', marginTop: '4rem', color: 'var(--danger)' }}>{error}</div>;
  }

  if (farms.length === 0) {
    return (
      <div className="container" style={{ textAlign: 'center', marginTop: '4rem' }}>
        <h3>No farms registered yet</h3>
        <p className="text-muted">Register your first farm to get started.</p>
      </div>
    );
  }

  return (
    <div className="container animate-fade-in" style={{ paddingTop: '6rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>My Farms Overview</h2>
        <button className="btn btn-secondary">
          Refresh Data
        </button>
      </div>

      <div style={{ height: '400px', width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-glass)', marginBottom: '2rem' }}>
        {loadError ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--danger)' }}>Error loading maps. Check console or API key.</div>
        ) : !isLoaded ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>Loading Satellite Map...</div>
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
                    fillColor: '#10b981',
                    fillOpacity: 0.4,
                    strokeWeight: 2,
                    strokeColor: '#059669',
                    clickable: false
                  }}
                />
              );
            })}
          </GoogleMap>
        )}
      </div>

      {farms.map((farm) => (
        <div key={farm.id} className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-glass)', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
            <div>
              <h3 style={{ margin: 0 }}>
                {farm.municipality} Farm
              </h3>
              <p className="text-muted" style={{ marginTop: '0.25rem' }}>{farm.crop} • {farm.area} hectares</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Overall Status</p>
              {farm.risk_status?.flood_risk === 'high' || farm.risk_status?.bph_risk === 'high' || farm.risk_status?.blast_risk === 'high'
                ? <span className="badge badge-danger" style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>CRITICAL ALERT</span>
                : <span className="badge badge-safe" style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>ALL CLEAR</span>
              }
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <h4 className="text-muted">Temperature</h4>
              <p style={{ fontSize: '1.5rem', fontWeight: 600 }}>{farm.weather?.temp_c ?? '--'}°C</p>
            </div>
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <h4 className="text-muted">Humidity</h4>
              <p style={{ fontSize: '1.5rem', fontWeight: 600 }}>{farm.weather?.humidity_pct ?? '--'}%</p>
            </div>
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <h4 className="text-muted">Rain (1hr)</h4>
              <p style={{ fontSize: '1.5rem', fontWeight: 600 }}>{farm.weather?.rain_1h_mm ?? '--'} mm</p>
            </div>
          </div>

          <h4 style={{ marginTop: '2rem', marginBottom: '1rem' }}>Pest & Disease Risk Factors</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between' }}>
              <span>Brown Planthopper</span>
              {getRiskBadge(farm.risk_status?.bph_risk)}
            </div>
            <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between' }}>
              <span>Rice Blast</span>
              {getRiskBadge(farm.risk_status?.blast_risk)}
            </div>
            <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between' }}>
              <span>Flood Risk</span>
              {getRiskBadge(farm.risk_status?.flood_risk)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
