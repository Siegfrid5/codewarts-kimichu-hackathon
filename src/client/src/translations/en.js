export const en = {
  // Navigation
  nav: {
    dashboard: 'Dashboard',
    consultant: 'AI Consultant',
    register: 'Register Farm',
    gabayani: 'GABAYANI'
  },

  // Landing Page
  landing: {
    hero: {
      title: 'Protect Your Harvest.',
      subtitle: 'Empower Your Farm.',
      description: 'GABAYANI uses satellite imagery, localized weather, and AI to predict crop risks before they destroy your livelihood. Sent straight to your phone via SMS.',
      ctaPrimary: 'Start Monitoring for Free',
      ctaSecondary: 'Learn More'
    },
    features: {
      title: 'Intelligence That Saves Harvests',
      description: 'Four-layer architecture delivering satellite-grade intelligence to feature phones',
      weather: {
        title: 'Micro-Climate Weather',
        description: 'High-resolution hourly weather data tailored specifically to your municipality\'s centroid. Updated 4x daily with precision tracking.'
      },
      risk: {
        title: 'Predictive Risk Engine',
        description: 'Scientific GDD accumulation models to predict Brown Planthopper, Rice Blast, and Floods before they strike.'
      },
      sms: {
        title: 'SMS-First Delivery',
        description: 'No internet required in the field. Receive critical alerts and daily digests via SMS in your local dialect.'
      },
      ai: {
        title: 'AI Agronomist',
        description: 'Chat with our Gemini-powered consultant that knows your farm\'s specific risks, weather patterns, and crop health.'
      }
    }
  },

  // Registration
  registration: {
    steps: {
      name: {
        title: "Let's get started.",
        question: "What's your first name?",
        placeholder: 'Jane'
      },
      phone: {
        title: 'Stay connected.',
        question: "What's your phone number?",
        placeholder: '09XXXXXXXXX'
      },
      municipality: {
        title: 'Location matters.',
        question: 'What municipality is your farm in?',
        placeholder: 'San Jose'
      },
      barangay: {
        title: 'Almost there.',
        question: 'What barangay?',
        placeholder: 'Barangay name'
      },
      dialect: {
        title: 'Language preference.',
        question: 'What dialect do you prefer?'
      },
      map: {
        title: 'Mark your territory.',
        question: 'Draw your farm boundary on the map.',
        instruction: 'Click on the map to draw corners of your farm.',
        completed: 'Farm boundary completed.',
        clear: 'Clear',
        finish: 'Finish Shape',
        complete: 'Complete Registration',
        processing: 'Processing...'
      }
    },
    success: {
      title: "You're all set!",
      description: 'GABAYANI is now monitoring your farm. You\'ll receive SMS alerts for weather, pest risks, and crop health.',
      goToDashboard: 'Go to Dashboard'
    },
    common: {
      step: 'Step',
      of: 'of',
      back: 'Back',
      pressEnter: 'Press Enter ↵',
      ok: 'OK'
    }
  },

  // Language Toggle
  language: {
    toggle: '🌐 Language',
    english: 'English',
    tagalog: 'Tagalog'
  }
};
