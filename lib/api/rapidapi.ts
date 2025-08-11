import { TravelCaptureInput } from '@/lib/types/travel';

// RapidAPI configuration
const RAPIDAPI_BASE_URL = 'https://rapidapi.com';
const RAPIDAPI_TIMEOUT = 10000; // 10 seconds
const MAX_RETRIES = 2;

export interface RapidAPIError {
  message: string;
  status?: number;
  code?: string;
  details?: any;
}

export class RapidAPIClient {
  private apiKey: string;
  private timeout: number;
  private retries: number;

  constructor() {
    this.apiKey = process.env.RAPIDAPI_KEY || '';
    this.timeout = RAPIDAPI_TIMEOUT;
    this.retries = MAX_RETRIES;

    if (!this.apiKey) {
      console.warn('RAPIDAPI_KEY not found in environment variables');
    }
  }

  /**
   * Generic method to call RapidAPI endpoints
   */
  private async callAPI(
    host: string,
    endpoint: string,
    params: Record<string, any> = {},
    method: 'GET' | 'POST' = 'GET'
  ): Promise<any> {
    const headers = {
      'X-RapidAPI-Key': this.apiKey,
      'X-RapidAPI-Host': host,
      'Content-Type': 'application/json',
    };

    const url = `https://${host}${endpoint}`;
    const options: RequestInit = {
      method,
      headers,
    };

    // Add query parameters for GET requests
    if (method === 'GET' && Object.keys(params).length > 0) {
      const queryParams = new URLSearchParams(params).toString();
      options.method = 'GET';
    } else if (method === 'POST') {
      options.body = JSON.stringify(params);
    }

    let lastError: RapidAPIError | null = null;

    for (let attempt = 0; attempt <= this.retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(
            errorData?.message || `API call failed with status ${response.status}`
          );
        }

        return await response.json();
      } catch (error) {
        lastError = {
          message: error instanceof Error ? error.message : 'Unknown API error',
          status: error instanceof Error && 'status' in error ? (error as any).status : undefined,
          code: error instanceof Error && 'code' in error ? (error as any).code : undefined,
          details: { attempt: attempt + 1, maxRetries: this.retries + 1 },
        };

        console.error(`RapidAPI call failed (attempt ${attempt + 1}):`, lastError);

        // Don't retry on final attempt
        if (attempt === this.retries) break;

        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }

    throw lastError || new Error('API call failed after all retries');
  }

  /**
   * Get weather information
   */
  async getWeatherInfo(destination: string): Promise<any> {
    try {
      return await this.callAPI(
        'weatherapi-com.rapidapi.com',
        '/forecast.json',
        {
          q: destination,
          days: 7,
          aqi: 'yes',
          alerts: 'yes'
        }
      );
    } catch (error) {
      console.error('Weather API error:', error);
      // Return mock data for development
      return this.getMockWeatherData(destination);
    }
  }

  /**
   * Get flight information (mock for now)
   */
  async getFlightInfo(origin: string, destination: string, departureDate?: string): Promise<any> {
    try {
      return await this.callAPI(
        'skyscanner-api.rapidapi.com',
        '/flights/search',
        {
          origin,
          destination,
          departure_date: departureDate || new Date().toISOString().split('T')[0],
          return_date: '', // One way for now
          adults: 1,
          children: 0,
          infants: 0,
          cabin_class: 'ECONOMY',
          currency: 'INR'
        }
      );
    } catch (error) {
      console.error('Flight API error:', error);
      return this.getMockFlightData(origin, destination);
    }
  }

  /**
   * Get hotel information
   */
  async getHotelInfo(destination: string, checkIn?: string, checkOut?: string): Promise<any> {
    try {
      const defaultCheckIn = checkIn || new Date().toISOString().split('T')[0];
      const defaultCheckOut = checkOut || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      return await this.callAPI(
        'booking-com15.rapidapi.com',
        '/hotels/searchHotels',
        {
          dest_id: destination,
          search_type: 'CITY',
          arrival_date: defaultCheckIn,
          departure_date: defaultCheckOut,
          adults: 1,
          children_age: '',
          room_qty: 1,
          units: 'metric',
          temperature_unit: 'c',
          languagecode: 'en-us',
          currency_code: 'INR'
        }
      );
    } catch (error) {
      console.error('Hotel API error:', error);
      return this.getMockHotelData(destination);
    }
  }

  /**
   * Get visa information for Indian passport holders
   */
  async getVisaInfo(destination: string): Promise<any> {
    try {
      return await this.callAPI(
        'visa-list.rapidapi.com',
        '/visa',
        {
          passport: 'IN', // Indian passport
          destination: destination,
        }
      );
    } catch (error) {
      console.error('Visa API error:', error);
      return this.getMockVisaData(destination);
    }
  }

  /**
   * Get tourist attractions
   */
  async getAttractions(destination: string): Promise<any> {
    try {
      return await this.callAPI(
        'world-tourist-attractions.rapidapi.com',
        '/attractions',
        {
          location: destination,
          limit: 10,
          offset: 0
        }
      );
    } catch (error) {
      console.error('Attractions API error:', error);
      return this.getMockAttractionsData(destination);
    }
  }

  /**
   * Get comprehensive travel data
   */
  async getTravelData(input: TravelCaptureInput): Promise<any> {
    const requests = [
      this.getWeatherInfo(input.destination),
      this.getFlightInfo(input.origin, input.destination),
      this.getHotelInfo(input.destination),
      this.getAttractions(input.destination),
    ];

    // Add visa info for international travel
    if (!this.isDomesticTravel(input.origin, input.destination)) {
      requests.push(this.getVisaInfo(input.destination));
    }

    try {
      const results = await Promise.allSettled(requests);
      
      return {
        weather: results[0].status === 'fulfilled' ? results[0].value : null,
        flights: results[1].status === 'fulfilled' ? results[1].value : null,
        hotels: results[2].status === 'fulfilled' ? results[2].value : null,
        attractions: results[3].status === 'fulfilled' ? results[3].value : null,
        visa: results[4]?.status === 'fulfilled' ? results[4].value : null,
        errors: results.map((result, index) => 
          result.status === 'rejected' ? { index, error: result.reason } : null
        ).filter(Boolean)
      };
    } catch (error) {
      console.error('Error fetching travel data:', error);
      throw error;
    }
  }

  /**
   * Check if travel is domestic (within India)
   */
  private isDomesticTravel(origin: string, destination: string): boolean {
    const indianCities = [
      'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Pune', 'Hyderabad',
      'Ahmedabad', 'Surat', 'Jaipur', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore',
      'Goa', 'Kerala', 'Rajasthan', 'Kashmir', 'Himachal Pradesh', 'Uttarakhand'
    ];

    const isOriginIndian = indianCities.some(city => origin.toLowerCase().includes(city.toLowerCase()));
    const isDestinationIndian = indianCities.some(city => destination.toLowerCase().includes(city.toLowerCase()));

    return isOriginIndian && isDestinationIndian;
  }

  // Mock data methods for development
  private getMockWeatherData(destination: string) {
    return {
      current: {
        temperature: 25,
        condition: 'Partly cloudy',
        humidity: 65,
      },
      forecast: [
        { date: '2024-01-01', high: 28, low: 20, condition: 'Sunny', rainChance: 10 },
        { date: '2024-01-02', high: 26, low: 18, condition: 'Cloudy', rainChance: 30 },
        { date: '2024-01-03', high: 24, low: 16, condition: 'Rainy', rainChance: 80 },
      ],
      bestMonths: ['October', 'November', 'December', 'January', 'February'],
      avoidMonths: ['June', 'July', 'August', 'September'],
    };
  }

  private getMockFlightData(origin: string, destination: string) {
    return [
      {
        airline: 'IndiGo',
        price: 8500,
        duration: '2h 15m',
        stops: 0,
        departure: '06:00',
        arrival: '08:15',
        bookingLink: 'https://example.com/book-flight-1'
      },
      {
        airline: 'Air India',
        price: 9200,
        duration: '2h 30m',
        stops: 0,
        departure: '14:30',
        arrival: '17:00',
        bookingLink: 'https://example.com/book-flight-2'
      }
    ];
  }

  private getMockHotelData(destination: string) {
    return [
      {
        name: 'Grand Palace Hotel',
        rating: 4.2,
        pricePerNight: 3500,
        location: `Central ${destination}`,
        amenities: ['WiFi', 'Pool', 'Gym', 'Spa'],
        bookingLink: 'https://example.com/book-hotel-1'
      },
      {
        name: 'Budget Inn',
        rating: 3.8,
        pricePerNight: 1800,
        location: `${destination} City Center`,
        amenities: ['WiFi', 'AC', 'Restaurant'],
        bookingLink: 'https://example.com/book-hotel-2'
      }
    ];
  }

  private getMockVisaData(destination: string) {
    return {
      required: true,
      type: 'Tourist Visa',
      duration: '30 days',
      cost: 2500,
      processingTime: '3-5 business days',
      documents: ['Passport', 'Photos', 'Travel itinerary'],
      embassyAddress: `${destination} Embassy, New Delhi`,
      onArrival: false,
      eVisa: true,
      notes: 'Tourist visa required for Indian passport holders'
    };
  }

  private getMockAttractionsData(destination: string) {
    return [
      {
        name: `${destination} Museum`,
        type: 'Museum',
        entryFee: 200,
        openingHours: '9:00 AM - 6:00 PM',
        description: `Famous museum in ${destination}`,
        rating: 4.5,
        timeNeeded: '2-3 hours',
        bookingRequired: false
      },
      {
        name: `${destination} Palace`,
        type: 'Historical Site',
        entryFee: 500,
        openingHours: '8:00 AM - 7:00 PM',
        description: `Historic palace in ${destination}`,
        rating: 4.8,
        timeNeeded: '3-4 hours',
        bookingRequired: true,
        bookingLink: 'https://example.com/book-palace'
      }
    ];
  }
}

// Export singleton instance
export const rapidAPIClient = new RapidAPIClient();