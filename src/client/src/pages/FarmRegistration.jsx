import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { GoogleMap, useJsApiLoader, Polygon } from '@react-google-maps/api';

const libraries = ['geometry'];
const defaultCenter = { lat: 15.4829, lng: 120.9735 }; // Central Luzon area

export default function FarmRegistration() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    farmer_name: '',
    phone: '',
    municipality: '',
    barangay: '',
    dialect: 'tagalog',
    crop: 'rice'
  });

  // Map state
  const [polygonCoords, setPolygonCoords] = useState([]);
  const [areaHectares, setAreaHectares] = useState(0);
  const [centroid, setCentroid] = useState(null);
  
  const mapRef = useRef(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
  }, []);

    const onMapClick = (e) => {
      // If loading or already closed shape, don't add more
      if (loading || areaHectares > 0) return;
      
      const newPoint = { lat: e.latLng.lat(), lng: e.latLng.lng() };
      setPolygonCoords([...polygonCoords, newPoint]);
    };
  
    const finishPolygon = () => {
      if (polygonCoords.length < 3) {
        alert("A polygon must have at least 3 points.");
        return;
      }
      
      // Calculate area and centroid
      const path = polygonCoords.map(p => new window.google.maps.LatLng(p.lat, p.lng));
      const sqMeters = window.google.maps.geometry.spherical.computeArea(path);
      const hectares = sqMeters / 10000;
      setAreaHectares(hectares);
  
      let latSum = 0;
      let lngSum = 0;
      polygonCoords.forEach(p => {
        latSum += p.lat;
        lngSum += p.lng;
      });
      setCentroid({
        lat: latSum / polygonCoords.length,
        lng: lngSum / polygonCoords.length
      });
    };
  
    const clearPolygon = () => {
      setPolygonCoords([]);
      setAreaHectares(0);
      setCentroid(null);
    };
  
    const handleSubmit = async (e) => {
      e.preventDefault();
      if (areaHectares === 0) {
        alert("Please complete your farm boundary before submitting.");
        return;
      }
      
      setLoading(true);
      
      // Close the loop for GeoJSON (first and last point must be the same)
      const geoJsonCoords = polygonCoords.map(p => [p.lng, p.lat]);
      geoJsonCoords.push([...geoJsonCoords[0]]);
  
      const payload = {
        ...formData,
        area_hectares: areaHectares,
        centroid_lat: centroid.lat,
        centroid_lng: centroid.lng,
        polygon_geojson: {
          type: "Polygon",
          coordinates: [geoJsonCoords]
        }
      };
  
      console.log("Submitting:", payload);
  
      setTimeout(() => {
        setLoading(false);
        setStep(3);
      }, 2000);
    };
  
    return (
      <div className="container animate-fade-in" style={{ maxWidth: step === 2 ? '1000px' : '800px' }}>
        <div className="glass-panel" style={{ padding: '3rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2>Register Your Farm</h2>
            <p className="text-muted">Connect your farm to the GABAYANI intelligence network.</p>
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '2rem' }}>
              <div style={{ color: step >= 1 ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>1. Details</div>
              <div style={{ color: step >= 2 ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>2. Mapping</div>
              <div style={{ color: step >= 3 ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>3. Success</div>
            </div>
          </div>
  
          {step === 1 && (
            <form onSubmit={(e) => { e.preventDefault(); setStep(2); }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="form-group">
                  <label className="form-label">Farmer Name</label>
                  <input type="text" name="farmer_name" className="form-input" required value={formData.farmer_name} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number (For SMS)</label>
                  <input type="text" name="phone" className="form-input" placeholder="09XXXXXXXXX" required value={formData.phone} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Municipality</label>
                  <input type="text" name="municipality" className="form-input" required value={formData.municipality} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Barangay</label>
                  <input type="text" name="barangay" className="form-input" required value={formData.barangay} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Preferred Dialect</label>
                  <select name="dialect" className="form-input" required value={formData.dialect} onChange={handleInputChange}>
                    <option value="tagalog">Tagalog</option>
                    <option value="ilocano">Ilocano</option>
                    <option value="cebuano">Cebuano</option>
                    <option value="english">English</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Crop Type</label>
                  <input type="text" className="form-input" value="Rice" readOnly style={{ opacity: 0.7 }} />
                </div>
              </div>
              <div style={{ textAlign: 'right', marginTop: '2rem' }}>
                <button type="submit" className="btn btn-primary">Next: Map Farm Boundary</button>
              </div>
            </form>
          )}
  
          {step === 2 && (
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0 }}>
                  {areaHectares === 0 
                    ? "Click on the map to draw corners of your farm." 
                    : "Farm boundary completed."}
                </h4>
                {areaHectares > 0 && (
                  <div style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: 'bold' }}>
                    Total Area: {areaHectares.toFixed(2)} Hectares
                  </div>
                )}
              </div>
  
              <div style={{ height: '500px', width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-glass)', marginBottom: '2rem' }}>
                {loadError ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--danger)' }}>Error loading maps. Check console/API key.</div>
                ) : !isLoaded ? (
                  <div style={{ padding: '2rem', textAlign: 'center' }}>Loading Google Maps...</div>
                ) : (
                  <GoogleMap
                    mapContainerStyle={{ width: '100%', height: '100%' }}
                    center={defaultCenter}
                    zoom={15}
                    onLoad={onMapLoad}
                    mapTypeId="hybrid"
                    onClick={onMapClick}
                    options={{ disableDefaultUI: true, zoomControl: true }}
                  >
                    {polygonCoords.length > 0 && (
                      <Polygon
                        path={polygonCoords}
                        options={{
                          fillColor: '#10b981',
                          fillOpacity: 0.4,
                          strokeWeight: 2,
                          strokeColor: '#059669',
                          clickable: false
                        }}
                      />
                    )}
                  </GoogleMap>
                )}
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setStep(1)}>Back</button>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button type="button" className="btn btn-secondary" onClick={clearPolygon} disabled={polygonCoords.length === 0}>
                    Clear
                  </button>
                  {areaHectares === 0 && polygonCoords.length >= 3 && (
                    <button type="button" className="btn btn-secondary" onClick={finishPolygon}>
                      Finish Shape
                    </button>
                  )}
                  <button type="submit" className="btn btn-primary" disabled={loading || areaHectares === 0}>
                    {loading ? 'Processing...' : 'Complete Registration'}
                  </button>
                </div>
              </div>
            </form>
          )}

        {step === 3 && (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <CheckCircle size={64} color="var(--safe)" style={{ margin: '0 auto 1.5rem auto' }} />
            <h2>Registration Successful!</h2>
            <p className="text-muted" style={{ maxWidth: '400px', margin: '0 auto 2rem auto' }}>
              GABAYANI is now fetching historical weather and analyzing satellite imagery for your farm. We will send you an SMS shortly.
            </p>
            <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
