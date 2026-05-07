/**
 * GABAYANI — Phase 2 End-to-End Test
 * 
 * Tests user registration, farm registration, and SCT risk computation pipeline.
 */

async function runTest() {
  const BASE_URL = 'http://localhost:3000/api';
  console.log('🚀 Starting Phase 2 E2E Test...\n');

  try {
    // 1. Register User
    console.log('1️⃣ Registering User...');
    const userRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Juan Dela Cruz',
        phone: '09123456789',
        password: 'securepassword123'
      })
    });
    
    let userData = await userRes.json();
    
    // If phone is already registered (from previous run), try login instead
    if (userRes.status === 409) {
      console.log('   User already exists, logging in instead...');
      const loginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: '09123456789',
          password: 'securepassword123'
        })
      });
      userData = await loginRes.json();
    }
    
    const token = userData.data.token;
    console.log(`   ✅ User authenticated. Token acquired.\n`);

    // 2. Register Farm
    console.log('2️⃣ Registering Farm...');
    const farmRes = await fetch(`${BASE_URL}/farms/register`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        farmer_name: 'Tomasino Farmer',
        phone: '09123456789',
        barangay: 'Sampaloc',
        municipality: 'Manila',
        crop: 'rice',
        dialect: 'tagalog',
        area_hectares: 21.5,
        centroid_lat: 14.6095,
        centroid_lng: 120.9816,
        polygon_geojson: {
          type: "Polygon",
          // Rough box around UST
          coordinates: [[[120.98, 14.60], [120.99, 14.60], [120.99, 14.61], [120.98, 14.61], [120.98, 14.60]]]
        }
      })
    });
    const farmData = await farmRes.json();
    console.log(`   ✅ Farm registered in ${farmData.data.farm.municipality}.\n`);

    // 3. Trigger SCT Weather Job (which will use mock data)
    console.log('3️⃣ Triggering SCT Weather Job (Risk Engine)...');
    const sctRes = await fetch(`${BASE_URL}/sct/weather-refresh`, { method: 'POST' });
    const sctData = await sctRes.json();
    console.log(`   ✅ SCT triggered. Summary:`);
    console.dir(sctData.summary, { depth: null, colors: true });
    console.log();

    // 4. Check Farm Risk Status
    console.log('4️⃣ Fetching My Farms (checking computed risk)...');
    const myFarmsRes = await fetch(`${BASE_URL}/farms/my-farms`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const myFarmsData = await myFarmsRes.json();
    
    console.log(`   ✅ Farm Status:`);
    const farmsList = myFarmsData.data.farms;
    const farm = farmsList[farmsList.length - 1];
    console.log(`      Location: ${farm.municipality}`);
    console.log(`      Weather (Mock): ${farm.weather.temp_c}°C, ${farm.weather.rain_1h_mm}mm rain`);
    console.log(`      Risks:`);
    console.log(`        - BPH:   ${farm.risk_status.bph_risk}`);
    console.log(`        - Blast: ${farm.risk_status.blast_risk}`);
    console.log(`        - Flood: ${farm.risk_status.flood_risk}`);
    
    console.log('\n🎉 Phase 2 functionality verified!');

  } catch (err) {
    console.error('❌ Test failed:', err.message);
  }
}

runTest();
