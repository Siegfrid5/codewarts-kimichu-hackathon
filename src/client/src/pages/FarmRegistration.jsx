import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleMap, useJsApiLoader, Polygon } from '@react-google-maps/api';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { en } from '../translations/en';
import { tl } from '../translations/tl';

const libraries = ['geometry'];
const defaultCenter = { lat: 15.4829, lng: 120.9735 }; // Central Luzon area

export default function FarmRegistration() {
  const { language } = useLanguage();
  const translations = language === 'en' ? en : tl;
  
  const navigate = useNavigate();
  const { setAuthFromTokens } = useAuth();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitError, setSubmitError] = useState(null);
  const [formData, setFormData] = useState({
    farmer_name: '',
    phone: '',
    username: '',
    email: '',
    password: '',
    municipality: '',
    barangay: '',
    dialect: 'tagalog',
    crop: 'rice'
  });

  const getSteps = () => [
    { id: 'name', title: translations.registration.steps.name.title, question: translations.registration.steps.name.question, field: 'farmer_name', type: 'text', placeholder: translations.registration.steps.name.placeholder },
    { id: 'phone', title: translations.registration.steps.phone.title, question: translations.registration.steps.phone.question, field: 'phone', type: 'text', placeholder: translations.registration.steps.phone.placeholder },
    { id: 'username', title: 'Create Username', question: 'Choose a username for your account', field: 'username', type: 'text', placeholder: 'username' },
    { id: 'email', title: 'Email (Optional)', question: 'Add your email address (optional)', field: 'email', type: 'text', placeholder: 'email@example.com' },
    { id: 'password', title: 'Create Password', question: 'Create a secure password (8+ chars, uppercase, lowercase, number, special char)', field: 'password', type: 'password', placeholder: 'Password' },
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

  // Clear error when changing steps
  useEffect(() => {
    setError('');
  }, [currentStepIndex]);

  // Validation functions
  const validateField = (field, value) => {
    switch (field) {
      case 'phone':
        // Philippine phone number format: 09 followed by 9 digits
        const phoneRegex = /^09\d{9}$/;
        if (!value) return 'Phone number is required';
        if (!phoneRegex.test(value)) return 'Invalid phone number format. Use 09XXXXXXXXX';
        return null;
      
      case 'email':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return 'Invalid email format';
        }
        return null;
      
      case 'password':
        if (!value) return 'Password is required';
        if (value.length < 8) return 'Password must be at least 8 characters';
        if (!/[A-Z]/.test(value)) return 'Password must contain at least one uppercase letter';
        if (!/[a-z]/.test(value)) return 'Password must contain at least one lowercase letter';
        if (!/[0-9]/.test(value)) return 'Password must contain at least one number';
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) return 'Password must contain at least one special character';
        return null;
      
      case 'username':
        if (!value) return 'Username is required';
        if (value.length < 3) return 'Username must be at least 3 characters';
        if (!/^[a-zA-Z0-9_]+$/.test(value)) return 'Username can only contain letters, numbers, and underscores';
        return null;
      
      case 'farmer_name':
        if (!value) return 'Name is required';
        if (value.length < 2) return 'Name must be at least 2 characters';
        return null;
      
      case 'municipality':
        if (!value) return 'Municipality is required';
        return null;
      
      case 'barangay':
        if (!value) return 'Barangay is required';
        return null;
      
      default:
        return null;
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setFormData({ ...formData, [currentStep.field]: value });
    
    // Real-time validation
    const validationError = validateField(currentStep.field, value);
    setError(validationError || '');
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
        setSubmitError('Please complete your farm boundary before proceeding.');
        return;
      }
      handleSubmit();
    } else {
      // Validate current field before proceeding
      const validationError = validateField(currentStep.field, formData[currentStep.field]);
      if (validationError) {
        setError(validationError);
        return;
      }
      
      if (currentStepIndex < steps.length - 1) {
        setCurrentStepIndex(currentStepIndex + 1);
      }
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setSubmitError(null);
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
      setSubmitError('A polygon must have at least 3 points.');
      return;
    }
    
    setSubmitError(null);
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
    setSubmitError(null);
  };

  /**
   * Extract a human-readable error message from the server's error payload.
   * The server may return error as a string, or as { message, details }.
   */
  const extractErrorMessage = (errorPayload, fallback = 'Something went wrong') => {
    if (!errorPayload) return fallback;
    if (typeof errorPayload === 'string') return errorPayload;
    if (errorPayload.details && Array.isArray(errorPayload.details)) {
      return errorPayload.details.join(', ');
    }
    if (errorPayload.message) return errorPayload.message;
    return fallback;
  };

  const handleSubmit = async () => {
    setLoading(true);
    setSubmitError(null);
    
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    let registerData = null;

    try {
      // ── Step 1: Register the user account ──
      let registerResponse;
      try {
        registerResponse = await fetch(`${API_BASE_URL}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.farmer_name,
            phone: formData.phone,
            username: formData.username,
            email: formData.email,
            password: formData.password,
          }),
        });
      } catch (networkErr) {
        throw new Error('Unable to connect to the server. Please check your internet connection and try again.');
      }

      // Handle non-JSON responses (e.g. 502 from proxy)
      let registerJson;
      try {
        registerJson = await registerResponse.json();
      } catch {
        throw new Error(`Server returned an unexpected response (HTTP ${registerResponse.status}). Please try again later.`);
      }

      if (!registerJson.success) {
        throw new Error(extractErrorMessage(registerJson.error, 'Account registration failed'));
      }

      registerData = registerJson;

      // ── Step 2: Register the farm ──
      const geoJsonCoords = polygonCoords.map(p => [p.lng, p.lat]);
      geoJsonCoords.push([...geoJsonCoords[0]]);

      const farmPayload = {
        farmer_name: formData.farmer_name,
        phone: formData.phone,
        municipality: formData.municipality,
        barangay: formData.barangay,
        dialect: formData.dialect,
        crop: formData.crop,
        area_hectares: areaHectares,
        centroid_lat: centroid.lat,
        centroid_lng: centroid.lng,
        polygon_geojson: {
          type: "Polygon",
          coordinates: [geoJsonCoords]
        }
      };

      let farmResponse;
      try {
        farmResponse = await fetch(`${API_BASE_URL}/api/farms/register`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${registerData.data.accessToken}`
          },
          body: JSON.stringify(farmPayload),
        });
      } catch (networkErr) {
        // User was created but farm request failed at network level — save auth state
        setAuthFromTokens({
          accessToken: registerData.data.accessToken,
          refreshToken: registerData.data.refreshToken,
          user: registerData.data.user,
        });
        throw new Error('Your account was created, but farm registration failed due to a network error. You can add your farm from the dashboard.');
      }

      // Handle non-JSON responses
      let farmJson;
      try {
        farmJson = await farmResponse.json();
      } catch {
        setAuthFromTokens({
          accessToken: registerData.data.accessToken,
          refreshToken: registerData.data.refreshToken,
          user: registerData.data.user,
        });
        throw new Error(`Your account was created, but farm registration returned an unexpected response (HTTP ${farmResponse.status}).`);
      }
      
      if (!farmJson.success) {
        // User was created but farm failed — save auth state so user isn't stuck
        setAuthFromTokens({
          accessToken: registerData.data.accessToken,
          refreshToken: registerData.data.refreshToken,
          user: registerData.data.user,
        });
        const farmErrMsg = extractErrorMessage(farmJson.error, 'Farm registration failed');
        throw new Error(`Your account was created, but farm registration failed: ${farmErrMsg}`);
      }

      // ── Both steps succeeded — update auth context and advance ──
      setAuthFromTokens({
        accessToken: registerData.data.accessToken,
        refreshToken: registerData.data.refreshToken,
        user: registerData.data.user,
      });

      setCurrentStepIndex(steps.length); // Success step
    } catch (err) {
      console.error('Registration error:', err);
      setSubmitError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Success screen ───
  if (currentStepIndex >= steps.length) {
    return (
      <div style={{
        minHeight: 'calc(100vh - 64px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        background: 'var(--surface-1)'
      }}>
        <div style={{
          maxWidth: '520px',
          width: '100%',
          background: 'var(--canvas)',
          borderRadius: 'var(--rounded-xl)',
          padding: '64px 40px',
          textAlign: 'center',
          boxShadow: 'var(--shadow-float)',
          border: '1px solid var(--hairline)',
          animation: 'scaleIn 0.4s ease'
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
            <span style={{ fontSize: '40px' }}>✅</span>
          </div>
          <h2 style={{ marginBottom: '12px', fontSize: '30px' }}>{translations.registration.success.title}</h2>
          <p style={{ 
            color: 'var(--ink-muted)', 
            marginBottom: '32px',
            fontSize: '16px',
            lineHeight: 1.6 
          }}>
            {translations.registration.success.description}
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/dashboard')} style={{ 
            width: '100%',
            padding: '16px',
            fontSize: '16px'
          }}>
            {translations.registration.success.goToDashboard}
          </button>
        </div>
      </div>
    );
  }

  // ─── Registration flow ───
  return (
    <div style={{
      minHeight: 'calc(100vh - 64px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 24px',
      background: 'var(--surface-1)'
    }}>
      <div style={{ 
        maxWidth: currentStep.type === 'map' ? '1100px' : '560px',
        width: '100%',
        background: 'var(--canvas)',
        borderRadius: 'var(--rounded-xl)',
        padding: currentStep.type === 'map' ? '32px' : '48px 40px',
        boxShadow: 'var(--shadow-float)',
        border: '1px solid var(--hairline)',
        animation: 'fadeIn 0.3s ease',
        transition: 'max-width 0.35s ease'
      }}>
        {/* Progress indicator — Ani green gradient */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
            {steps.map((_, index) => (
              <div
                key={index}
                style={{
                  flex: 1,
                  height: '4px',
                  borderRadius: 'var(--rounded-pill)',
                  background: index <= currentStepIndex ? 'var(--primary)' : 'var(--hairline)',
                  transition: 'all 0.4s ease'
                }}
              />
            ))}
          </div>
          <div style={{ 
            fontSize: '13px', 
            color: 'var(--ink-subtle)',
            fontWeight: 500,
            letterSpacing: '0.3px'
          }}>
            {translations.registration.common.step} {currentStepIndex + 1} {translations.registration.common.of} {steps.length}
          </div>
        </div>

        {/* Inline error banner */}
        {submitError && (
          <div
            id="registration-error-banner"
            style={{
              marginBottom: '24px',
              padding: '16px 20px',
              borderRadius: 'var(--rounded-xl)',
              background: 'rgba(220, 38, 38, 0.08)',
              border: '1px solid rgba(220, 38, 38, 0.25)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              animation: 'fadeIn 0.3s ease',
            }}
          >
            <AlertTriangle size={20} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ flex: 1 }}>
              <div style={{
                color: '#ef4444',
                fontWeight: 600,
                fontSize: '14px',
                lineHeight: 1.5,
                marginBottom: submitError.includes('account was created') ? '8px' : 0,
              }}>
                {submitError}
              </div>
              {submitError.includes('account was created') && (
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  style={{
                    background: 'rgba(220, 38, 38, 0.1)',
                    border: '1px solid rgba(220, 38, 38, 0.25)',
                    color: '#ef4444',
                    padding: '8px 16px',
                    borderRadius: 'var(--rounded-pill)',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '13px',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => e.target.style.background = 'rgba(220, 38, 38, 0.18)'}
                  onMouseLeave={(e) => e.target.style.background = 'rgba(220, 38, 38, 0.1)'}
                >
                  Go to Dashboard →
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => setSubmitError(null)}
              aria-label="Dismiss error"
              style={{
                flexShrink: 0,
                background: 'transparent',
                border: 'none',
                color: '#ef4444',
                cursor: 'pointer',
                fontSize: '18px',
                lineHeight: 1,
                padding: '0 4px',
              }}
            >
              ×
            </button>
          </div>
        )}

        {currentStep.type === 'map' ? (
          <div>
            <h2 style={{ marginBottom: '8px', fontSize: '30px', letterSpacing: '-0.3px' }}>{currentStep.title}</h2>
            <p style={{ color: 'var(--ink-muted)', marginBottom: '24px', fontSize: '16px' }}>{currentStep.question}</p>
            
            <div style={{ 
              marginBottom: '16px', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center' 
            }}>
              <span style={{ 
                fontSize: '14px', 
                color: 'var(--ink-subtle)',
                fontWeight: 500 
              }}>
                {areaHectares === 0 ? translations.registration.steps.map.instruction : translations.registration.steps.map.completed}
              </span>
              {areaHectares > 0 && (
                <div className="badge badge-safe" style={{ 
                  padding: '8px 16px', 
                  fontWeight: 700, 
                  fontSize: '14px' 
                }}>
                  {areaHectares.toFixed(2)} hectares
                </div>
              )}
            </div>

            {/* Map container per DESIGN.md */}
            <div style={{ 
              height: '450px', 
              width: '100%', 
              borderRadius: 'var(--rounded-xl)', 
              overflow: 'hidden', 
              boxShadow: 'var(--shadow-float)',
              background: 'var(--surface-1)',
              marginBottom: '24px' 
            }}>
              {loadError ? (
                <div style={{ 
                  padding: '32px', 
                  textAlign: 'center', 
                  color: 'var(--semantic-error)',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>Error loading maps. Check console/API key.</div>
              ) : !isLoaded ? (
                <div style={{ 
                  padding: '32px', 
                  textAlign: 'center',
                  color: 'var(--ink-muted)',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>Loading Google Maps...</div>
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
                        fillColor: '#2B7A3D',
                        fillOpacity: 0.4,
                        strokeWeight: 2,
                        strokeColor: '#1B5E2B',
                        clickable: false
                      }}
                    />
                  )}
                </GoogleMap>
              )}
            </div>
            
            {/* Map action buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <button 
                type="button" 
                onClick={handleBack}
                className="btn btn-ghost"
                style={{
                  padding: '12px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span style={{ fontSize: '18px' }}>←</span>
                {translations.registration.common.back}
              </button>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button 
                  type="button" 
                  onClick={clearPolygon}
                  disabled={polygonCoords.length === 0}
                  className="btn btn-secondary"
                  style={{
                    padding: '12px 20px',
                    opacity: polygonCoords.length === 0 ? 0.5 : 1,
                    cursor: polygonCoords.length === 0 ? 'not-allowed' : 'pointer'
                  }}
                >
                  {translations.registration.steps.map.clear}
                </button>
                {areaHectares === 0 && polygonCoords.length >= 3 && (
                  <button 
                    type="button" 
                    onClick={finishPolygon}
                    className="btn btn-secondary"
                    style={{ padding: '12px 20px' }}
                  >
                    {translations.registration.steps.map.finish}
                  </button>
                )}
                <button 
                  type="button" 
                  onClick={handleNext}
                  disabled={loading || areaHectares === 0}
                  className="btn btn-primary"
                  style={{
                    padding: '12px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    opacity: loading || areaHectares === 0 ? 0.5 : 1,
                    cursor: loading || areaHectares === 0 ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading ? translations.registration.steps.map.processing : translations.registration.steps.map.complete}
                  {!loading && <span style={{ fontSize: '18px' }}>→</span>}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <h2 style={{ 
              marginBottom: '8px', 
              fontSize: '30px',
              fontWeight: 700,
              letterSpacing: '-0.3px'
            }}>{currentStep.title}</h2>
            <p style={{ 
              color: 'var(--ink-muted)', 
              marginBottom: '32px', 
              fontSize: '16px',
              lineHeight: 1.6
            }}>{currentStep.question}</p>
            
            {currentStep.type === 'select' ? (
              <div style={{ marginBottom: '32px' }}>
                {currentStep.options.map((option) => {
                  const optionLabels = {
                    tagalog: language === 'en' ? 'Tagalog' : 'Tagalog',
                    ilocano: language === 'en' ? 'Ilocano' : 'Ilocano',
                    cebuano: language === 'en' ? 'Cebuano' : 'Cebuano',
                    english: language === 'en' ? 'English' : 'English'
                  };
                  const isSelected = formData[currentStep.field] === option;
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
                        padding: '16px 20px',
                        marginBottom: '10px',
                        background: isSelected ? 'var(--primary)' : 'var(--surface-1)',
                        border: isSelected ? '2px solid var(--primary)' : '2px solid var(--hairline)',
                        color: isSelected ? 'var(--on-primary)' : 'var(--ink)',
                        borderRadius: 'var(--rounded-md)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontSize: '16px',
                        fontWeight: 500,
                        fontFamily: 'Plus Jakarta Sans, sans-serif',
                        transition: 'all 0.25s ease',
                        minHeight: '48px'
                      }}
                      onMouseEnter={(e) => { 
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = 'var(--primary)';
                          e.currentTarget.style.background = 'var(--primary-pale)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = 'var(--hairline)';
                          e.currentTarget.style.background = 'var(--surface-1)';
                        }
                      }}
                    >
                      {optionLabels[option]}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div style={{ marginBottom: '32px' }}>
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
                    padding: '16px 0',
                    fontSize: '24px',
                    fontWeight: 600,
                    background: 'transparent',
                    border: 'none',
                    borderBottom: error 
                      ? '3px solid var(--semantic-error)' 
                      : '3px solid var(--primary)',
                    color: 'var(--ink)',
                    outline: 'none',
                    transition: 'border-color 0.25s ease',
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    letterSpacing: '-0.3px'
                  }}
                  onFocus={(e) => e.target.style.borderColor = error ? 'var(--semantic-error)' : 'var(--primary)'}
                  onBlur={(e) => e.target.style.borderColor = error ? 'var(--semantic-error)' : 'var(--hairline)'}
                />
                {error && (
                  <div style={{
                    marginTop: '10px',
                    fontSize: '14px',
                    color: 'var(--semantic-error)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontWeight: 500
                  }}>
                    <span>⚠️</span>
                    <span>{error}</span>
                  </div>
                )}
              </div>
            )}
            
            {/* Navigation buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {currentStepIndex > 0 ? (
                <button 
                  type="button" 
                  onClick={handleBack}
                  className="btn btn-ghost"
                  style={{
                    padding: '12px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <span style={{ fontSize: '18px' }}>←</span>
                  {translations.registration.common.back}
                </button>
              ) : (
                <div />
              )}
              
              {currentStep.type !== 'select' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span style={{ 
                    fontSize: '13px', 
                    color: 'var(--ink-subtle)',
                    fontWeight: 500 
                  }}>
                    {translations.registration.common.pressEnter}
                  </span>
                  <button 
                    type="button"
                    onClick={handleNext}
                    disabled={!formData[currentStep.field]}
                    className="btn btn-primary"
                    style={{
                      padding: '12px 28px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      opacity: !formData[currentStep.field] ? 0.5 : 1,
                      cursor: !formData[currentStep.field] ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {translations.registration.common.ok}
                    <span style={{ fontSize: '18px' }}>→</span>
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
