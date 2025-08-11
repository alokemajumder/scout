import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { validateCompleteTravelInput } from '@/lib/validations/travel';
import { rapidAPIClient } from '@/lib/api/rapidapi';
import { TravelCaptureInput } from '@/lib/types/travel';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the travel input
    const validation = validateCompleteTravelInput(body);
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid travel data',
          details: validation.error?.issues 
        },
        { status: 400 }
      );
    }

    const travelInput: TravelCaptureInput = validation.data;
    console.log('Creating travel card for:', {
      destination: travelInput.destination,
      origin: travelInput.origin,
      travelType: travelInput.travelType,
      isGuest: travelInput.isGuest
    });

    // Generate unique card ID
    const cardId = `card_${uuidv4()}`;
    
    // Create basic card structure first (for immediate response)
    const basicCard = {
      id: cardId,
      destination: travelInput.destination,
      origin: travelInput.origin,
      travelType: travelInput.travelType,
      isGuest: travelInput.isGuest,
      sessionId: travelInput.sessionId,
      createdAt: new Date().toISOString(),
      status: 'processing'
    };

    // Start background data fetching (don't await - return immediately)
    fetchTravelDataAsync(travelInput, cardId).catch(error => {
      console.error('Background data fetching failed:', error);
    });

    // Return immediate success response
    return NextResponse.json({
      success: true,
      cardId: cardId,
      message: 'Travel card creation started',
      data: basicCard
    });

  } catch (error) {
    console.error('Travel card creation error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create travel card',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Background function to fetch comprehensive travel data
async function fetchTravelDataAsync(travelInput: TravelCaptureInput, cardId: string) {
  try {
    console.log(`[${cardId}] Starting background data fetching...`);
    
    // Fetch comprehensive travel data from APIs
    const travelData = await rapidAPIClient.getTravelData(travelInput);
    
    console.log(`[${cardId}] API data fetched:`, {
      hasWeather: !!travelData.weather,
      hasFlights: !!travelData.flights,
      hasHotels: !!travelData.hotels,
      hasAttractions: !!travelData.attractions,
      hasVisa: !!travelData.visa,
      errors: travelData.errors?.length || 0
    });

    // Process the data into travel card format
    const processedCard = {
      id: cardId,
      ...travelInput,
      cardData: {
        overview: {
          destination: travelInput.destination,
          country: getCountryFromDestination(travelInput.destination),
          famousFor: getDestinationHighlights(travelInput.destination),
          bestTime: getBestTimeToVisit(travelData.weather),
          currency: getCurrency(travelInput.destination),
          language: getLanguages(travelInput.destination)
        },
        transportation: {
          flights: processFlightData(travelData.flights),
          trains: processDomesticTransport(travelInput, 'train'),
          buses: processDomesticTransport(travelInput, 'bus')
        },
        accommodation: {
          hotels: processHotelData(travelData.hotels),
          airbnb: [], // Would be populated with Airbnb API
          hostels: []
        },
        attractions: processAttractionData(travelData.attractions),
        dining: {
          restaurants: [],
          indianRestaurants: [],
          vegetarianOptions: true
        },
        budget: calculateBudget(travelInput, travelData),
        weather: processWeatherData(travelData.weather),
        visaInfo: travelData.visa ? processVisaData(travelData.visa) : undefined,
        indianTravelerInfo: {
          upiAcceptance: getUPIAcceptance(travelInput.destination),
          indianBankCards: ['RuPay', 'Visa', 'Mastercard'],
          simCardOptions: getSIMOptions(travelInput.destination),
          embassyContact: getEmbassyContact(travelInput.destination),
          emergencyNumbers: getEmergencyNumbers(travelInput.destination),
          culturalTips: getCulturalTips(travelInput.destination)
        },
        itineraries: generateItineraries(travelInput, travelData),
        bookingLinks: {
          flights: ['https://makemytrip.com', 'https://cleartrip.com'],
          hotels: ['https://booking.com', 'https://agoda.com'],
          attractions: []
        }
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'completed'
    };

    // Store the completed card (in a real app, this would go to database)
    console.log(`[${cardId}] Travel card processing completed successfully`);
    
    // Here you would typically:
    // 1. Save to database
    // 2. Send real-time update to user (WebSocket/SSE)
    // 3. Cache for quick retrieval
    
    return processedCard;

  } catch (error) {
    console.error(`[${cardId}] Background processing failed:`, error);
    
    // Update card status to failed
    // In a real app, you'd update the database and notify the user
    return null;
  }
}

// Helper functions for data processing
function getCountryFromDestination(destination: string): string {
  // Simple mapping - in reality, you'd use a proper location service
  const countryMap: Record<string, string> = {
    'goa': 'India',
    'kerala': 'India', 
    'dubai': 'UAE',
    'thailand': 'Thailand',
    'singapore': 'Singapore',
    'bali': 'Indonesia'
  };
  
  const key = destination.toLowerCase();
  return countryMap[key] || 'Unknown';
}

function getDestinationHighlights(destination: string): string[] {
  const highlights: Record<string, string[]> = {
    'goa': ['Beaches', 'Nightlife', 'Portuguese Heritage', 'Seafood'],
    'kerala': ['Backwaters', 'Hill Stations', 'Spices', 'Ayurveda'],
    'dubai': ['Shopping', 'Architecture', 'Desert Safari', 'Luxury'],
    'thailand': ['Temples', 'Street Food', 'Islands', 'Culture']
  };
  
  return highlights[destination.toLowerCase()] || ['Tourism', 'Culture', 'Food', 'Shopping'];
}

function getBestTimeToVisit(weatherData: any): string {
  if (!weatherData) return 'October to March';
  return weatherData.bestMonths?.join(', ') || 'Year-round';
}

function getCurrency(destination: string): string {
  const currencyMap: Record<string, string> = {
    'india': 'INR',
    'uae': 'AED',
    'thailand': 'THB',
    'singapore': 'SGD',
    'indonesia': 'IDR'
  };
  
  const country = getCountryFromDestination(destination).toLowerCase();
  return currencyMap[country] || 'USD';
}

function getLanguages(destination: string): string[] {
  const languageMap: Record<string, string[]> = {
    'india': ['Hindi', 'English'],
    'uae': ['Arabic', 'English'],
    'thailand': ['Thai', 'English'],
    'singapore': ['English', 'Mandarin', 'Malay', 'Tamil']
  };
  
  const country = getCountryFromDestination(destination).toLowerCase();
  return languageMap[country] || ['English'];
}

function processFlightData(flightData: any): any[] {
  if (!flightData || !Array.isArray(flightData)) return [];
  return flightData.slice(0, 3); // Return top 3 options
}

function processDomesticTransport(travelInput: TravelCaptureInput, type: 'train' | 'bus'): any[] {
  // Only for domestic Indian travel
  const isDomestic = ['india', 'indian'].some(keyword => 
    travelInput.destination.toLowerCase().includes(keyword) ||
    travelInput.origin.toLowerCase().includes(keyword)
  );
  
  if (!isDomestic) return [];
  
  // Mock data for now
  if (type === 'train') {
    return [
      {
        trainNumber: '12345',
        trainName: 'Express Train',
        class: '3A',
        price: 1200,
        duration: '8h 30m',
        departure: '22:00',
        arrival: '06:30'
      }
    ];
  }
  
  return [
    {
      operator: 'Private Bus',
      busType: 'AC Sleeper',
      price: 800,
      duration: '10h 00m',
      departure: '21:00',
      arrival: '07:00'
    }
  ];
}

function processHotelData(hotelData: any): any[] {
  if (!hotelData || !Array.isArray(hotelData)) return [];
  return hotelData.slice(0, 5); // Return top 5 options
}

function processAttractionData(attractionData: any): any[] {
  if (!attractionData || !Array.isArray(attractionData)) return [];
  return attractionData.slice(0, 10); // Return top 10 attractions
}

function calculateBudget(travelInput: TravelCaptureInput, travelData: any): any {
  const baseMultipliers = {
    'Tight': { accommodation: 1500, food: 800, transport: 0.8, activities: 500 },
    'Comfortable': { accommodation: 3500, food: 1500, transport: 1.2, activities: 1200 },
    'Luxury': { accommodation: 8000, food: 3000, transport: 2.0, activities: 3000 }
  };
  
  const multiplier = baseMultipliers[travelInput.budget];
  const days = parseInt(travelInput.duration.split('-')[0]) || 7;
  
  const perPerson = {
    tight: (multiplier.accommodation * days) + (multiplier.food * days) + (multiplier.activities * days),
    comfortable: multiplier.accommodation * days * 1.5,
    luxury: multiplier.accommodation * days * 3
  };
  
  const travelers = getTravelerCount(travelInput);
  
  return {
    perPerson,
    total: {
      tight: perPerson.tight * travelers,
      comfortable: perPerson.comfortable * travelers,  
      luxury: perPerson.luxury * travelers
    },
    breakdown: {
      accommodation: multiplier.accommodation * days,
      transportation: 5000, // Base flight cost
      food: multiplier.food * days,
      attractions: multiplier.activities * days,
      miscellaneous: 2000
    },
    currency: 'INR'
  };
}

function getTravelerCount(travelInput: TravelCaptureInput): number {
  switch (travelInput.travelType) {
    case 'single':
      return 1;
    case 'family':
      const family = travelInput.travelerDetails.familyMembers;
      return (family?.adults || 1) + (family?.children || 0);
    case 'group':
      return travelInput.travelerDetails.groupSize || 4;
    default:
      return 1;
  }
}

function processWeatherData(weatherData: any): any {
  if (!weatherData) {
    return {
      current: { temperature: 25, condition: 'Pleasant', humidity: 60 },
      forecast: [],
      bestMonths: ['October', 'November', 'December', 'January', 'February'],
      avoidMonths: ['June', 'July', 'August']
    };
  }
  return weatherData;
}

function processVisaData(visaData: any): any {
  return visaData;
}

function getUPIAcceptance(destination: string): boolean {
  const upiCountries = ['india', 'uae', 'singapore'];
  return upiCountries.some(country => 
    destination.toLowerCase().includes(country)
  );
}

function getSIMOptions(destination: string): string[] {
  const simOptions: Record<string, string[]> = {
    'india': ['Jio', 'Airtel', 'Vi'],
    'uae': ['Etisalat', 'du'],
    'thailand': ['AIS', 'True', 'dtac'],
    'singapore': ['Singtel', 'StarHub', 'M1']
  };
  
  const country = getCountryFromDestination(destination).toLowerCase();
  return simOptions[country] || ['Local SIM available'];
}

function getEmbassyContact(destination: string): string | undefined {
  const country = getCountryFromDestination(destination);
  if (country === 'India') return undefined;
  
  return `Indian Embassy, ${destination}`;
}

function getEmergencyNumbers(destination: string): string[] {
  const emergencyNumbers: Record<string, string[]> = {
    'india': ['100 (Police)', '101 (Fire)', '102 (Ambulance)'],
    'uae': ['999 (Police)', '997 (Ambulance)', '998 (Fire)'],
    'thailand': ['191 (Police)', '199 (Fire/Ambulance)'],
    'singapore': ['999 (Police)', '995 (Ambulance/Fire)']
  };
  
  const country = getCountryFromDestination(destination).toLowerCase();
  return emergencyNumbers[country] || ['112 (International Emergency)'];
}

function getCulturalTips(destination: string): string[] {
  const tips: Record<string, string[]> = {
    'uae': ['Dress modestly', 'Respect Ramadan timings', 'No public drinking'],
    'thailand': ['Remove shoes in temples', 'Don\'t touch heads', 'Wai greeting'],
    'singapore': ['No chewing gum', 'Don\'t jaywalk', 'Keep right on escalators'],
    'indonesia': ['Dress modestly', 'Use right hand for eating', 'Respect local customs']
  };
  
  const country = getCountryFromDestination(destination).toLowerCase();
  return tips[country] || ['Respect local customs', 'Dress appropriately', 'Be polite'];
}

function generateItineraries(travelInput: TravelCaptureInput, travelData: any): any[] {
  const duration = travelInput.duration;
  const itineraries = [];
  
  // Generate different itinerary options based on duration
  if (duration.includes('2-3')) {
    itineraries.push({
      duration: '3 days',
      title: 'Quick Getaway',
      days: [
        {
          day: 1,
          title: 'Arrival & City Tour',
          activities: [
            { time: '10:00', activity: 'Check-in to hotel', location: 'Hotel' },
            { time: '14:00', activity: 'Local sightseeing', location: 'City center' },
            { time: '19:00', activity: 'Welcome dinner', location: 'Local restaurant' }
          ]
        },
        {
          day: 2,
          title: 'Main Attractions',
          activities: [
            { time: '09:00', activity: 'Visit top attraction', location: 'Main tourist spot' },
            { time: '13:00', activity: 'Lunch & shopping', location: 'Market area' },
            { time: '16:00', activity: 'Cultural experience', location: 'Cultural site' }
          ]
        },
        {
          day: 3,
          title: 'Departure',
          activities: [
            { time: '10:00', activity: 'Check-out & last minute shopping', location: 'Hotel/Shops' },
            { time: '14:00', activity: 'Departure', location: 'Airport/Station' }
          ]
        }
      ]
    });
  }
  
  return itineraries;
}