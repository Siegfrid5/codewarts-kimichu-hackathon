export const tl = {
  // Navigation
  nav: {
    dashboard: 'Dashboard',
    consultant: 'AI Konsultant',
    register: 'Magrehistro ng Bukid',
    gabayani: 'GABAYANI'
  },

  // Landing Page
  landing: {
    hero: {
      title: 'Pangalagaan ang Ani.',
      subtitle: 'Pahusayin ang Iyong Bukid.',
      description: 'Gumagamit ang GABAYANI ng satellite imagery, lokal na weather, at AI upang hulaan ang mga panganib sa pananim bago ito sirain ang iyong kabuhayan. Ipinadala nang direkta sa iyong telepono sa pamamagitan ng SMS.',
      ctaPrimary: 'Simulan ang Pagsubaybay nang Libre',
      ctaSecondary: 'Alamin Pa'
    },
    features: {
      title: 'Intelligence na Nagliligtas ng Ani',
      description: 'Apat na layer na arkitektura na nagbibigay ng satellite-grade intelligence sa feature phones',
      weather: {
        title: 'Micro-Climate Weather',
        description: 'High-resolution hourly weather data na spesipiko sa centroid ng iyong munisipalidad. Na-update 4x araw-araw sa precision tracking.'
      },
      risk: {
        title: 'Predictive Risk Engine',
        description: 'Siyensipikong GDD accumulation models upang hulaan ang Brown Planthopper, Rice Blast, at Baha bago ito mangyari.'
      },
      sms: {
        title: 'SMS-First Delivery',
        description: 'Walang kailangang internet sa bukid. Tumanggap ng critical alerts at daily digests sa pamamagitan ng SMS sa iyong lokal na diyalekto.'
      },
      ai: {
        title: 'AI Agronomist',
        description: 'Mag-usap sa aming Gemini-powered consultant na alam ang mga panganib ng iyong bukid, weather patterns, at kalusugan ng pananim.'
      }
    }
  },

  // Registration
  registration: {
    steps: {
      name: {
        title: 'Simulan natin.',
        question: 'Ano ang iyong pangalan?',
        placeholder: 'Juan'
      },
      phone: {
        title: 'Manatiling konektado.',
        question: 'Ano ang iyong numero ng telepono?',
        placeholder: '09XXXXXXXXX'
      },
      municipality: {
        title: 'Mahalaga ang lokasyon.',
        question: 'Saang munisipalidad ang iyong bukid?',
        placeholder: 'San Jose'
      },
      barangay: {
        title: 'Halos tapos na.',
        question: 'Anong barangay?',
        placeholder: 'Pangalan ng barangay'
      },
      dialect: {
        title: 'Gusto sa wika.',
        question: 'Anong diyalekto ang gusto mo?'
      },
      map: {
        title: 'Markahan ang iyong teritoryo.',
        question: 'Guhitin ang boundary ng iyong bukid sa mapa.',
        instruction: 'Mag-click sa mapa upang guhitin ang mga sulok ng iyong bukid.',
        completed: 'Natapos na ang boundary ng bukid.',
        clear: 'Burahin',
        finish: 'Tapusin ang Hugis',
        complete: 'Kumpleto na ang Pagrehistro',
        processing: 'Pinoproseso...'
      }
    },
    success: {
      title: 'Tapos ka na!',
      description: 'GABAYANI ay ngayon nagmomonitor ng iyong bukid. Makakatanggap ka ng SMS alerts para sa weather, panganib ng peste, at kalusugan ng pananim.',
      goToDashboard: 'Pumunta sa Dashboard'
    },
    common: {
      step: 'Hakbang',
      of: 'ng',
      back: 'Bumalik',
      pressEnter: 'Pindutin ang Enter ↵',
      ok: 'OK'
    }
  },

  // Language Toggle
  language: {
    toggle: '🌐 Wika',
    english: 'English',
    tagalog: 'Tagalog'
  }
};
