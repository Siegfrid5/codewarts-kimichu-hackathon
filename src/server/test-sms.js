const smsService = require('./services/smsService');
const config = require('./config');

async function testSms() {
  console.log('Testing SMS dispatch using Traccar Gateway at:', config.traccar.url);
  console.log('Token:', config.traccar.token ? 'Set' : 'Not set');
  console.log('API Key:', config.traccar.apiKey ? 'Set' : 'Not set');

  // Provide your phone number here!
  const testPhone = '+639773798106'; // Replace with your actual phone number
  const testMessage = 'GABAYANI ALERT: Manila Farm Update. Current temp: 32°C, Humidity: 75%, Rainfall: 5mm. Risk Level: MODERATE. Brown Planthopper risk detected. Monitor your rice field closely for signs of infestation.';
  const englishTemplate = 'GABAYANI ALERT: Manila Farm Update. Current temp: 32°C, Humidity: 75%, Rainfall: 5mm. Risk Level: MODERATE. Brown Planthopper risk detected. Monitor your rice field closely for signs of infestation.';

  try {
    await smsService.send(
      testPhone,
      testMessage,
      englishTemplate,
      null, // farmId
      'test_alert',
      'all_clear'
    );
    console.log('Test dispatch complete. Check your phone!');
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    process.exit(0);
  }
}

testSms();
