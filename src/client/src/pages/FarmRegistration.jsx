import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { GoogleMap, useJsApiLoader, Polygon } from '@react-google-maps/api';
import { useLanguage } from '../contexts/LanguageContext';
import { en } from '../translations/en';
import { tl } from '../translations/tl';

const libraries = ['geometry'];
const defaultCenter = { lat: 15.4829, lng: 120.9735 }; // Central Luzon area

export default function FarmRegistration() {
  const { language } = useLanguage();
  const translations = language === 'en' ? en : tl;
  
  const navigate = useNavigate();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    farmer_name: '',
    phone: '',
    municipality: '',
    barangay: '',
    dialect: 'tagalog',
    crop: 'rice'
  });

  const getSteps = () => [
    { id: 'name', title: translations.registration.steps.name.title, question: translations.registration.steps.name.question, field: 'farmer_name', type: 'text', placeholder: translations.registration.steps.name.placeholder },
    { id: 'phone', title: translations.registration.steps.phone.title, question: translations.registration.steps.phone.question, field: 'phone', type: 'text', placeholder: translations.registration.steps.phone.placeholder },
    { id: 'municipality', title: translations.registration.steps.municipality.title, question: translations.registration.steps.municipality.question, field: 'municipality', type: 'text', placeholder: translations.registration.steps.municipality.placeholder },
    { id: 'barangay', title: translations.registration.steps.barangay.title, question: translations.registration.steps.barangay.question, field: 'barangay', type: 'text', placeholder: translations.registration.steps.barangay.placeholder },
    { id: 'dialect', title: translations.registration.steps.dialect.title, question: translations.registration.steps.dialect.question, field: 'dialect', type: 'select', options: ['tagalog', 'ilocano', 'cebuano', 'english'] },
    { id: 'map', title: translations.registration.steps.map.title, question: translations.registration.steps.map.question, field: 'map', type: 'map' }
  ];

  const steps = getSteps();
  const currentStep = steps[currentStepIndex] || steps[0];

  const [polygonCoords, setPolygonCoords] = useState([]);
  const [areaHectares, setAreaHectares] = useState(0);
  const [centroid, setCentroid] = useState(null);
  
  const mapRef = useRef(null);
  const inputRef = useRef(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  useEffect(() => {
    if (inputRef.current && currentStep.type !== 'map') {
      inputRef.current.focus();
    }
  }, [currentStepIndex, currentStep.type]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [currentStep.field]: e.target.value });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && currentStep.type !== 'map') {
      e.preventDefault();
      handleNext();
    }
  };

  const handleNext = () => {
    if (currentStep.type === 'map') {
      if (areaHectares === 0) {
        alert("Please complete your farm boundary before proceeding.");
        return;
      }
      handleSubmit();
    } else {
      if (!formData[currentStep.field]) {
        return;
      }
      if (currentStepIndex < steps.length - 1) {
        setCurrentStepIndex(currentStepIndex + 1);
      }
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
  }, []);

  const onMapClick = (e) => {
    if (loading || areaHectares > 0) return;
    const newPoint = { lat: e.latLng.lat(), lng: e.latLng.lng() };
    setPolygonCoords([...polygonCoords, newPoint]);
  };

  const finishPolygon = () => {
    if (polygonCoords.length < 3) {
      alert("A polygon must have at least 3 points.");
      return;
    }
    
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

  const handleSubmit = async () => {
    setLoading(true);
    
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
      setCurrentStepIndex(steps.length); // Success step
    }, 2000);
  };

  if (currentStepIndex >= steps.length) {
    return (
      <div className="container animate-fade-in" style={{ maxWidth: '600px', paddingTop: '6rem' }}>
        <div className="glass-panel" style={{ padding: '4rem 3rem', textAlign: 'center' }}>
          <CheckCircle size={80} color="var(--accent-primary)" style={{ margin: '0 auto 2rem auto' }} />
          <h2 style={{ marginBottom: '1rem' }}>{translations.registration.success.title}</h2>
          <p className="text-muted" style={{ marginBottom: '2rem' }}>
            {translations.registration.success.description}
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/dashboard')} style={{ width: '100%' }}>
            {translations.registration.success.goToDashboard}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container animate-fade-in" style={{ maxWidth: currentStep.type === 'map' ? '1200px' : '600px', paddingTop: '6rem' }}>
      <div className="glass-panel" style={{ padding: currentStep.type === 'map' ? '2rem' : '4rem 3rem' }}>
        {/* Progress indicator */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            {steps.map((_, index) => (
              <div
                key={index}
                style={{
                  flex: 1,
                  height: '2px',
                  background: index <= currentStepIndex ? 'var(--accent-primary)' : 'var(--border-glass)',
                  transition: 'background 0.3s ease'
                }}
              />
            ))}
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            {translations.registration.common.step} {currentStepIndex + 1} {translations.registration.common.of} {steps.length}
          </div>
        </div>

        {currentStep.type === 'map' ? (
          <div>
            <h2 style={{ marginBottom: '0.5rem' }}>{currentStep.title}</h2>
            <p className="text-muted" style={{ marginBottom: '1.5rem' }}>{currentStep.question}</p>
            
            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                {areaHectares === 0 ? translations.registration.steps.map.instruction : translations.registration.steps.map.completed}
              </span>
              {areaHectares > 0 && (
                <div style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.875rem' }}>
                  {areaHectares.toFixed(2)} hectares
                </div>
              )}
            </div>

            <div style={{ height: '500px', width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-glass)', marginBottom: '1.5rem' }}>
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
              <button 
                type="button" 
                onClick={handleBack}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border-glass)',
                  color: 'var(--text-primary)',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.background = 'var(--border-glass)'}
                onMouseLeave={(e) => e.target.style.background = 'transparent'}
              >
                <ArrowLeft size={18} />
                {translations.registration.common.back}
              </button>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button 
                  type="button" 
                  onClick={clearPolygon}
                  disabled={polygonCoords.length === 0}
                  style={{
                    background: polygonCoords.length === 0 ? 'var(--border-glass)' : 'transparent',
                    border: '1px solid var(--border-glass)',
                    color: 'var(--text-primary)',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    cursor: polygonCoords.length === 0 ? 'not-allowed' : 'pointer',
                    opacity: polygonCoords.length === 0 ? 0.5 : 1,
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => { if (polygonCoords.length > 0) e.target.style.background = 'var(--border-glass)'; }}
                  onMouseLeave={(e) => e.target.style.background = 'transparent'}
                >
                  {translations.registration.steps.map.clear}
                </button>
                {areaHectares === 0 && polygonCoords.length >= 3 && (
                  <button 
                    type="button" 
                    onClick={finishPolygon}
                    style={{
                      background: 'transparent',
                      border: '1px solid var(--accent-primary)',
                      color: 'var(--accent-primary)',
                      padding: '0.75rem 1.5rem',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.target.style.background = 'rgba(16, 185, 129, 0.1)'}
                    onMouseLeave={(e) => e.target.style.background = 'transparent'}
                  >
                    {translations.registration.steps.map.finish}
                  </button>
                )}
                <button 
                  type="button" 
                  onClick={handleNext}
                  disabled={loading || areaHectares === 0}
                  style={{
                    background: loading || areaHectares === 0 ? 'var(--border-glass)' : 'var(--accent-primary)',
                    border: 'none',
                    color: loading || areaHectares === 0 ? 'var(--text-secondary)' : 'white',
                    padding: '0.75rem 2rem',
                    borderRadius: '8px',
                    cursor: loading || areaHectares === 0 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    opacity: loading || areaHectares === 0 ? 0.5 : 1,
                    transition: 'all 0.2s ease',
                    transform: 'scale(1)'
                  }}
                  onMouseEnter={(e) => { if (!loading && areaHectares > 0) e.target.style.transform = 'scale(1.02)'; }}
                  onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                >
                  {loading ? translations.registration.steps.map.processing : translations.registration.steps.map.complete}
                  {!loading && <ArrowRight size={18} />}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <h2 style={{ marginBottom: '0.5rem', fontSize: '1.75rem' }}>{currentStep.title}</h2>
            <p className="text-muted" style={{ marginBottom: '2rem', fontSize: '1.125rem' }}>{currentStep.question}</p>
            
            {currentStep.type === 'select' ? (
              <div style={{ marginBottom: '2rem' }}>
                {currentStep.options.map((option) => {
                  const optionLabels = {
                    tagalog: language === 'en' ? 'Tagalog' : 'Tagalog',
                    ilocano: language === 'en' ? 'Ilocano' : 'Ilocano',
                    cebuano: language === 'en' ? 'Cebuano' : 'Cebuano',
                    english: language === 'en' ? 'English' : 'English'
                  };
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, [currentStep.field]: option });
                        handleNext();
                      }}
                      style={{
                        width: '100%',
                        padding: '1rem',
                        marginBottom: '0.75rem',
                        background: formData[currentStep.field] === option ? 'var(--accent-primary)' : 'transparent',
                        border: formData[currentStep.field] === option ? 'var(--accent-primary)' : '1px solid var(--border-glass)',
                        color: formData[currentStep.field] === option ? 'white' : 'var(--text-primary)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.2s ease',
                        transform: 'scale(1)'
                      }}
                      onMouseEnter={(e) => { 
                        if (formData[currentStep.field] !== option) {
                          e.target.style.background = 'var(--border-glass)';
                          e.target.style.transform = 'scale(1.01)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (formData[currentStep.field] !== option) {
                          e.target.style.background = 'transparent';
                          e.target.style.transform = 'scale(1)';
                        }
                      }}
                    >
                      {optionLabels[option]}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div style={{ marginBottom: '2rem' }}>
                <input
                  ref={inputRef}
                  type={currentStep.type}
                  name={currentStep.field}
                  value={formData[currentStep.field]}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder={currentStep.placeholder}
                  style={{
                    width: '100%',
                    padding: '1rem 0',
                    fontSize: '1.5rem',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: '2px solid var(--accent-primary)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    transition: 'border-color 0.2s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--accent-primary)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border-glass)'}
                />
              </div>
            )}
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {currentStepIndex > 0 ? (
                <button 
                  type="button" 
                  onClick={handleBack}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--border-glass)',
                    color: 'var(--text-primary)',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.background = 'var(--border-glass)'}
                  onMouseLeave={(e) => e.target.style.background = 'transparent'}
                >
                  <ArrowLeft size={18} />
                  {translations.registration.common.back}
                </button>
              ) : (
                <div />
              )}
              
              {currentStep.type !== 'select' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{translations.registration.common.pressEnter}</span>
                  <button 
                    type="button"
                    onClick={handleNext}
                    disabled={!formData[currentStep.field]}
                    style={{
                      background: !formData[currentStep.field] ? 'var(--border-glass)' : 'var(--accent-primary)',
                      border: 'none',
                      color: !formData[currentStep.field] ? 'var(--text-secondary)' : 'white',
                      padding: '0.75rem 2rem',
                      borderRadius: '8px',
                      cursor: !formData[currentStep.field] ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      opacity: !formData[currentStep.field] ? 0.5 : 1,
                      transition: 'all 0.2s ease',
                      transform: 'scale(1)'
                    }}
                    onMouseEnter={(e) => { if (formData[currentStep.field]) e.target.style.transform = 'scale(1.02)'; }}
                    onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                  >
                    {translations.registration.common.ok}
                    <ArrowRight size={18} />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
