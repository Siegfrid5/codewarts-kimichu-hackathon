const smsService = require('./services/smsService');
const config = require('./config');

async function testSms() {
  console.log('Testing SMS dispatch using Traccar Gateway at:', config.traccar.url);

  // Provide your phone number here!
  const testPhone = '+639618200269'; // Replace with your actual phone number
  const testMessage = 'Mabuhay! Ito ay isang test message mula sa GABAYANI system via Traccar SMS Gateway.';
  const englishTemplate = 'Mabuhay! This is a test message from the GABAYANI system via Traccar SMS Gateway.';

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
