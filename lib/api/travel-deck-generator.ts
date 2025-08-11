// Travel Deck Generator using OpenRouter LLM
import { openRouterClient, LLMMessage } from './openrouter';
import { MODEL_CONFIGS, TRAVEL_DECK_TYPES } from './openrouter-config';
import { TravelDeck, TravelDeckCard } from '@/lib/types/travel-deck';
import { TravelCaptureInput } from '@/lib/types/travel';
import { v4 as uuidv4 } from 'uuid';

export class TravelDeckGenerator {
  
  /**
   * Generate a complete travel deck with all card types
   */
  async generateCompleteDeck(
    input: TravelCaptureInput,
    apiData?: any
  ): Promise<TravelDeck> {
    console.log('Starting comprehensive travel deck generation...');
    
    const deckId = `deck_${uuidv4()}`;
    const cards: TravelDeckCard[] = [];
    
    // Generate each card type
    for (const cardType of TRAVEL_DECK_TYPES) {
      try {
        console.log(`Generating ${cardType} card...`);
        const card = await this.generateCard(cardType, input, apiData);
        if (card) {
          cards.push(card);
        }
      } catch (error) {
        console.error(`Failed to generate ${cardType} card:`, error);
        // Continue with other cards even if one fails
      }
    }
    
    // Sort cards by priority
    cards.sort((a, b) => a.priority - b.priority);
    
    const deck: TravelDeck = {
      id: deckId,
      sessionId: input.sessionId,
      destination: input.destination,
      origin: input.origin,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      cards,
      metadata: {
        travelType: input.travelType,
        duration: input.duration,
        budget: input.budget,
        travelerCount: this.getTravelerCount(input),
        generatedBy: 'OpenRouter Claude 3.5 Sonnet',
        version: '1.0.0'
      }
    };
    
    console.log(`Travel deck generated with ${cards.length} cards`);
    return deck;
  }
  
  /**
   * Generate a specific card type
   */
  private async generateCard(
    cardType: typeof TRAVEL_DECK_TYPES[number],
    input: TravelCaptureInput,
    apiData?: any
  ): Promise<TravelDeckCard | null> {
    const isDomestic = this.isDomesticTravel(input.origin, input.destination);
    
    const systemPrompt = this.getSystemPrompt(cardType, isDomestic);
    const userPrompt = this.getUserPrompt(cardType, input, apiData);
    
    try {
      const response = await openRouterClient.generateContent(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        MODEL_CONFIGS.TRAVEL_GENERATION
      );
      
      // Parse JSON response
      const content = this.parseJsonResponse(response.content);
      
      if (!content) {
        throw new Error('Failed to parse card content');
      }
      
      // Create card structure
      const card: TravelDeckCard = {
        id: `card_${uuidv4()}`,
        type: cardType,
        title: this.getCardTitle(cardType, input.destination),
        subtitle: this.getCardSubtitle(cardType, input),
        content,
        priority: this.getCardPriority(cardType),
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } as TravelDeckCard;
      
      return card;
      
    } catch (error) {
      console.error(`Error generating ${cardType} card:`, error);
      
      // Return mock card as fallback
      return this.getMockCard(cardType, input);
    }
  }
  
  private getSystemPrompt(cardType: string, isDomestic: boolean): string {
    const basePrompt = `You are an expert travel planner creating comprehensive travel cards for Indian travelers.
    
CRITICAL REQUIREMENTS:
1. All prices MUST be in Indian Rupees (₹)
2. Focus on Indian traveler needs (vegetarian food, visa requirements for Indian passport)
3. Provide practical, actionable information
4. Be specific with timings, costs, and locations
5. Return ONLY valid JSON, no markdown or additional text

TRAVEL TYPE: ${isDomestic ? 'Domestic (within India)' : 'International'}`;

    const cardPrompts: Record<string, string> = {
      overview: `${basePrompt}
Create an overview card with destination highlights, best time to visit, languages, and quick tips.`,
      
      itinerary: `${basePrompt}
Create a detailed day-by-day itinerary with activities, timings, locations, and costs.
Include meal suggestions and accommodation changes.`,
      
      transport: `${basePrompt}
Create a transport card with flights, trains, local transport options, and transfer details.
Include specific timings, costs, and booking tips.`,
      
      accommodation: `${basePrompt}
Create an accommodation card with hotel options across budget tiers.
Include amenities, location details, and booking recommendations.`,
      
      attractions: `${basePrompt}
Create an attractions card with must-see places, activities, and hidden gems.
Include entry fees, timings, and booking requirements.`,
      
      dining: `${basePrompt}
Create a dining card with restaurant recommendations, local dishes, and dietary options.
Focus on vegetarian/vegan options for Indian travelers.`,
      
      budget: `${basePrompt}
Create a comprehensive budget card with three tiers (tight, comfortable, luxury).
Include detailed breakdown, daily averages, and money-saving tips.`,
      
      visa: `${basePrompt}
Create a visa card specific for Indian passport holders.
Include requirements, process, costs, and embassy details.`,
      
      weather: `${basePrompt}
Create a weather card with seasonal information and packing recommendations.
Include best/avoid months and weather-appropriate clothing.`,
      
      culture: `${basePrompt}
Create a culture card with customs, etiquette, language phrases, and religious considerations.
Help Indian travelers navigate cultural differences respectfully.`,
      
      emergency: `${basePrompt}
Create an emergency card with important numbers, embassy details, hospitals, and safety tips.
Include Indian embassy contact and areas to avoid.`,
      
      shopping: `${basePrompt}
Create a shopping card with markets, souvenirs, and customs limits.
Include bargaining tips and authentic purchase locations.`
    };
    
    return cardPrompts[cardType] || basePrompt;
  }
  
  private getUserPrompt(
    cardType: string,
    input: TravelCaptureInput,
    apiData?: any
  ): string {
    const context = `
Destination: ${input.destination}
Origin: ${input.origin}
Duration: ${input.duration}
Budget: ${input.budget}
Travel Type: ${input.travelType}
Travel Style: ${input.travelStyle}
Dietary: ${input.dietary}
Season: ${input.season}
Motivation: ${input.motivation}

${apiData ? `Available API Data:
${JSON.stringify(apiData, null, 2).substring(0, 1000)}...` : ''}`;

    return `${context}

Generate a ${cardType} card with comprehensive, practical information.
Return ONLY the JSON content for the card.`;
  }
  
  private parseJsonResponse(response: string): any {
    try {
      // Clean response
      const cleaned = response
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      // Find JSON object
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return JSON.parse(cleaned);
    } catch (error) {
      console.error('Failed to parse JSON response:', error);
      return null;
    }
  }
  
  private getCardTitle(cardType: string, destination: string): string {
    const titles: Record<string, string> = {
      overview: `${destination} Overview`,
      itinerary: 'Your Journey Itinerary',
      transport: 'Transportation Guide',
      accommodation: 'Where to Stay',
      attractions: 'Must-See & Do',
      dining: 'Food & Dining',
      budget: 'Budget Planner',
      visa: 'Visa & Documentation',
      weather: 'Weather & Packing',
      culture: 'Culture & Customs',
      emergency: 'Emergency Information',
      shopping: 'Shopping Guide'
    };
    
    return titles[cardType] || cardType;
  }
  
  private getCardSubtitle(cardType: string, input: TravelCaptureInput): string {
    const subtitles: Record<string, string> = {
      overview: `${input.duration} trip for ${this.getTravelerCount(input)} travelers`,
      itinerary: `Day-by-day plan for your ${input.duration} journey`,
      transport: 'Flights, trains, and local transport',
      accommodation: `${input.budget} tier options`,
      attractions: 'Top places and experiences',
      dining: 'Restaurants and local cuisine',
      budget: `${input.budget} budget breakdown`,
      visa: 'For Indian passport holders',
      weather: `${input.season} season travel`,
      culture: 'Local customs and etiquette',
      emergency: 'Important contacts and safety',
      shopping: 'Markets and souvenirs'
    };
    
    return subtitles[cardType] || '';
  }
  
  private getCardPriority(cardType: string): number {
    const priorities: Record<string, number> = {
      overview: 1,
      itinerary: 2,
      transport: 3,
      accommodation: 4,
      attractions: 5,
      dining: 6,
      budget: 7,
      visa: 8,
      weather: 9,
      culture: 10,
      emergency: 11,
      shopping: 12
    };
    
    return priorities[cardType] || 99;
  }
  
  private getTravelerCount(input: TravelCaptureInput): number {
    switch (input.travelType) {
      case 'single':
        return 1;
      case 'family':
        const family = input.travelerDetails.familyMembers;
        return (family?.adults || 1) + (family?.children || 0);
      case 'group':
        return input.travelerDetails.groupSize || 4;
      default:
        return 1;
    }
  }
  
  private isDomesticTravel(origin: string, destination: string): boolean {
    const indianKeywords = ['india', 'mumbai', 'delhi', 'bangalore', 'chennai', 
                           'kolkata', 'pune', 'hyderabad', 'goa', 'kerala', 
                           'rajasthan', 'kashmir', 'himachal'];
    
    const isOriginIndian = indianKeywords.some(keyword => 
      origin.toLowerCase().includes(keyword)
    );
    const isDestinationIndian = indianKeywords.some(keyword => 
      destination.toLowerCase().includes(keyword)
    );
    
    return isOriginIndian && isDestinationIndian;
  }
  
  private getMockCard(cardType: string, input: TravelCaptureInput): TravelDeckCard {
    // Return a basic mock card structure
    return {
      id: `mock_${uuidv4()}`,
      type: cardType,
      title: this.getCardTitle(cardType, input.destination),
      subtitle: this.getCardSubtitle(cardType, input),
      content: this.getMockContent(cardType, input),
      priority: this.getCardPriority(cardType),
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as any;
  }
  
  private getMockContent(cardType: string, input: TravelCaptureInput): any {
    const isDomestic = this.isDomesticTravel(input.origin, input.destination);
    const localCurrency = isDomestic ? 'INR' : this.getDestinationCurrency(input.destination);
    
    // Return comprehensive mock content based on card type
    const mockContents: Record<string, any> = {
      overview: {
        destination: input.destination,
        country: isDomestic ? 'India' : this.getCountryFromDestination(input.destination),
        duration: input.duration,
        travelType: input.travelType,
        highlights: this.getDestinationHighlights(input.destination),
        bestTime: 'October to March',
        currency: localCurrency,
        languages: this.getDestinationLanguages(input.destination),
        quickTips: this.getDestinationTips(input.destination, isDomestic)
      },
      
      itinerary: {
        duration: input.duration,
        days: this.generateMockItinerary(input.destination, input.duration, isDomestic)
      },
      
      transport: {
        destination: input.destination,
        origin: input.origin,
        flights: this.getMockFlightInfo(input.origin, input.destination, isDomestic),
        localTransport: this.getMockLocalTransport(input.destination, isDomestic),
        tips: ['Book flights early', 'Check visa requirements', 'Download offline maps']
      },
      
      accommodation: {
        destination: input.destination,
        currency: localCurrency,
        options: this.getMockAccommodationOptions(input.destination, isDomestic),
        bookingTips: ['Compare prices on multiple platforms', 'Read recent reviews', 'Check cancellation policy']
      },
      
      attractions: {
        destination: input.destination,
        currency: localCurrency,
        attractions: this.getMockAttractions(input.destination, isDomestic)
      },
      
      dining: {
        destination: input.destination,
        currency: localCurrency,
        restaurants: this.getMockDiningOptions(input.destination, isDomestic),
        localCuisine: this.getMockLocalCuisine(input.destination),
        dietaryOptions: this.getMockDietaryOptions(input.destination, isDomestic)
      },
      
      budget: this.getMockBudgetContent(input.destination, input.budget, isDomestic),
      
      visa: {
        destination: input.destination,
        required: !isDomestic,
        indianPassport: true,
        requirements: this.getMockVisaRequirements(input.destination, isDomestic),
        process: this.getMockVisaProcess(input.destination, isDomestic),
        fees: this.getMockVisaFees(input.destination, isDomestic)
      },
      
      weather: {
        destination: input.destination,
        season: input.season,
        climate: this.getMockWeatherInfo(input.destination),
        packing: this.getMockPackingList(input.destination, input.season)
      },
      
      culture: {
        destination: input.destination,
        customs: this.getMockCulturalInfo(input.destination, isDomestic),
        etiquette: this.getMockEtiquette(input.destination, isDomestic),
        phrases: this.getMockUsefulPhrases(input.destination, isDomestic)
      },
      
      emergency: {
        destination: input.destination,
        indianEmbassy: this.getMockEmbassyInfo(input.destination, isDomestic),
        emergencyNumbers: this.getMockEmergencyNumbers(input.destination, isDomestic),
        hospitals: this.getMockHospitals(input.destination, isDomestic),
        safetyTips: this.getMockSafetyTips(input.destination, isDomestic)
      },
      
      shopping: {
        destination: input.destination,
        currency: localCurrency,
        markets: this.getMockShoppingInfo(input.destination, isDomestic),
        souvenirs: this.getMockSouvenirs(input.destination),
        customsLimits: this.getMockCustomsLimits(isDomestic)
      }
    };
    
    return mockContents[cardType] || { 
      destination: input.destination,
      content: `Comprehensive ${cardType} information for ${input.destination}`,
      tips: ['Plan ahead', 'Check local requirements', 'Book accommodations early'],
      currency: localCurrency
    };
  }

  // Helper methods for mock content generation
  private getDestinationCurrency(destination: string): string {
    const currencyMap: Record<string, string> = {
      'dubai': 'AED', 'uae': 'AED', 'abu dhabi': 'AED',
      'thailand': 'THB', 'bangkok': 'THB', 'phuket': 'THB',
      'singapore': 'SGD',
      'japan': 'JPY', 'tokyo': 'JPY', 'osaka': 'JPY',
      'usa': 'USD', 'america': 'USD', 'new york': 'USD', 'california': 'USD',
      'uk': 'GBP', 'britain': 'GBP', 'london': 'GBP', 'england': 'GBP',
      'europe': 'EUR', 'germany': 'EUR', 'france': 'EUR', 'italy': 'EUR', 'spain': 'EUR',
      'australia': 'AUD', 'sydney': 'AUD', 'melbourne': 'AUD',
      'canada': 'CAD', 'toronto': 'CAD', 'vancouver': 'CAD'
    };

    const key = destination.toLowerCase();
    for (const [dest, currency] of Object.entries(currencyMap)) {
      if (key.includes(dest)) return currency;
    }
    return 'USD';
  }

  private getCountryFromDestination(destination: string): string {
    const countryMap: Record<string, string> = {
      'dubai': 'UAE', 'abu dhabi': 'UAE',
      'bangkok': 'Thailand', 'phuket': 'Thailand',
      'singapore': 'Singapore',
      'tokyo': 'Japan', 'osaka': 'Japan',
      'new york': 'USA', 'california': 'USA',
      'london': 'UK', 'manchester': 'UK',
      'paris': 'France', 'rome': 'Italy', 'berlin': 'Germany',
      'sydney': 'Australia', 'melbourne': 'Australia',
      'toronto': 'Canada', 'vancouver': 'Canada'
    };

    const key = destination.toLowerCase();
    for (const [dest, country] of Object.entries(countryMap)) {
      if (key.includes(dest)) return country;
    }
    return destination;
  }

  private getDestinationHighlights(destination: string): string[] {
    const highlights: Record<string, string[]> = {
      'dubai': ['Burj Khalifa', 'Gold Souk', 'Desert Safari', 'Luxury Shopping'],
      'thailand': ['Temples', 'Street Food', 'Beaches', 'Thai Massage'],
      'singapore': ['Gardens by the Bay', 'Marina Bay Sands', 'Hawker Centers', 'Clean City'],
      'japan': ['Temples', 'Cherry Blossoms', 'Technology', 'Sushi'],
      'usa': ['Skyscrapers', 'Museums', 'Entertainment', 'Diversity'],
      'uk': ['History', 'Castles', 'Pubs', 'Royal Heritage'],
      'default': ['Culture', 'Local Cuisine', 'Architecture', 'Heritage']
    };

    const key = destination.toLowerCase();
    for (const [dest, items] of Object.entries(highlights)) {
      if (key.includes(dest)) return items;
    }
    return highlights.default;
  }

  private getDestinationLanguages(destination: string): string[] {
    const languageMap: Record<string, string[]> = {
      'dubai': ['Arabic', 'English'],
      'thailand': ['Thai', 'English'],
      'singapore': ['English', 'Mandarin', 'Malay'],
      'japan': ['Japanese', 'English'],
      'usa': ['English'],
      'uk': ['English'],
      'france': ['French', 'English'],
      'germany': ['German', 'English'],
      'default': ['English', 'Local Language']
    };

    const key = destination.toLowerCase();
    for (const [dest, langs] of Object.entries(languageMap)) {
      if (key.includes(dest)) return langs;
    }
    return languageMap.default;
  }

  private getDestinationTips(destination: string, isDomestic: boolean): string[] {
    if (isDomestic) {
      return ['Carry ID proof', 'Book trains early', 'Check weather', 'Carry cash for local vendors'];
    }
    return ['Check visa requirements', 'Get travel insurance', 'Notify bank', 'Download offline maps', 'Carry passport copies'];
  }

  private generateMockItinerary(destination: string, duration: string, isDomestic: boolean): any[] {
    const days = parseInt(duration) || 3;
    const mockDays = [];

    for (let i = 1; i <= Math.min(days, 7); i++) {
      mockDays.push({
        day: i,
        title: `Day ${i} - ${this.getDayTitle(destination, i)}`,
        activities: [
          {
            time: '09:00',
            title: `Morning Activity ${i}`,
            description: `Explore ${destination} morning attractions`,
            location: destination,
            cost: isDomestic ? '₹500' : this.formatForeignCurrency(25, destination)
          },
          {
            time: '14:00',
            title: `Afternoon Activity ${i}`,
            description: `Visit popular ${destination} landmarks`,
            location: destination,
            cost: isDomestic ? '₹800' : this.formatForeignCurrency(40, destination)
          }
        ]
      });
    }

    return mockDays;
  }

  private getDayTitle(destination: string, day: number): string {
    const titles = ['Arrival & Exploration', 'Main Attractions', 'Cultural Immersion', 'Adventure Day', 'Relaxation', 'Shopping & Local Markets', 'Departure'];
    return titles[day - 1] || `Explore ${destination}`;
  }

  private getMockBudgetContent(destination: string, budgetLevel: string, isDomestic: boolean): any {
    const localCurrency = isDomestic ? 'INR' : this.getDestinationCurrency(destination);
    const baseMultiplier = isDomestic ? 1 : this.getCurrencyMultiplier(destination);

    const budgets = {
      tight: {
        total: 30000 * baseMultiplier,
        daily: 5000 * baseMultiplier,
        accommodation: 1500 * baseMultiplier,
        food: 1000 * baseMultiplier,
        transport: 800 * baseMultiplier,
        activities: 700 * baseMultiplier
      },
      comfortable: {
        total: 60000 * baseMultiplier,
        daily: 10000 * baseMultiplier,
        accommodation: 3000 * baseMultiplier,
        food: 2000 * baseMultiplier,
        transport: 1500 * baseMultiplier,
        activities: 1500 * baseMultiplier
      },
      luxury: {
        total: 120000 * baseMultiplier,
        daily: 20000 * baseMultiplier,
        accommodation: 8000 * baseMultiplier,
        food: 5000 * baseMultiplier,
        transport: 3000 * baseMultiplier,
        activities: 4000 * baseMultiplier
      }
    };

    const budget = budgets[budgetLevel as keyof typeof budgets] || budgets.comfortable;

    return {
      destination,
      currency: localCurrency,
      currencySymbol: this.getCurrencySymbol(localCurrency),
      isDomestic,
      exchangeRate: isDomestic ? null : this.getMockExchangeRate(localCurrency),
      budget: {
        level: budgetLevel,
        total: budget.total,
        daily: budget.daily,
        breakdown: {
          accommodation: budget.accommodation,
          food: budget.food,
          transport: budget.transport,
          activities: budget.activities,
          shopping: Math.round(budget.daily * 0.2),
          miscellaneous: Math.round(budget.daily * 0.1)
        }
      },
      inrEquivalent: isDomestic ? null : {
        total: Math.round(budget.total * this.getMockExchangeRate(localCurrency)),
        daily: Math.round(budget.daily * this.getMockExchangeRate(localCurrency))
      },
      tips: [
        'Book accommodations in advance for better rates',
        'Use local transport to save money',
        isDomestic ? 'Carry cash for small vendors' : 'Notify your bank about international travel',
        'Compare prices before making purchases'
      ]
    };
  }

  private getCurrencyMultiplier(destination: string): number {
    const multipliers: Record<string, number> = {
      'dubai': 0.3, 'uae': 0.3,
      'thailand': 0.8, 'bangkok': 0.8,
      'singapore': 0.18,
      'japan': 0.006,
      'usa': 0.012,
      'uk': 0.0095,
      'europe': 0.011,
      'australia': 0.018,
      'canada': 0.015
    };

    const key = destination.toLowerCase();
    for (const [dest, mult] of Object.entries(multipliers)) {
      if (key.includes(dest)) return mult;
    }
    return 0.012; // Default USD multiplier
  }

  private getCurrencySymbol(currency: string): string {
    const symbols: Record<string, string> = {
      'INR': '₹', 'USD': '$', 'EUR': '€', 'GBP': '£',
      'AED': 'د.إ', 'THB': '฿', 'SGD': 'S$', 'JPY': '¥',
      'AUD': 'A$', 'CAD': 'C$'
    };
    return symbols[currency] || currency;
  }

  private getMockExchangeRate(fromCurrency: string): number {
    const rates: Record<string, number> = {
      'USD': 83.25, 'EUR': 90.15, 'GBP': 105.50,
      'AED': 22.65, 'THB': 2.35, 'SGD': 61.80,
      'JPY': 0.56, 'AUD': 54.20, 'CAD': 61.90
    };
    return rates[fromCurrency] || 83.25;
  }

  private formatForeignCurrency(amount: number, destination: string): string {
    const currency = this.getDestinationCurrency(destination);
    const symbol = this.getCurrencySymbol(currency);
    const convertedAmount = amount * this.getCurrencyMultiplier(destination);
    const inrAmount = Math.round(convertedAmount * this.getMockExchangeRate(currency));
    
    return `${symbol} ${convertedAmount.toFixed(2)} (₹${inrAmount})`;
  }

  // Additional mock methods (simplified for brevity)
  private getMockFlightInfo(origin: string, destination: string, isDomestic: boolean): any {
    return {
      type: isDomestic ? 'domestic' : 'international',
      estimatedCost: isDomestic ? '₹8,000 - ₹15,000' : this.formatForeignCurrency(300, destination),
      duration: isDomestic ? '2-3 hours' : '6-8 hours',
      tips: ['Book 2-3 months in advance', 'Check baggage limits', 'Arrive 2 hours early']
    };
  }

  private getMockLocalTransport(destination: string, isDomestic: boolean): any {
    return {
      options: isDomestic ? ['Metro', 'Bus', 'Auto', 'Taxi'] : ['Metro', 'Taxi', 'Bus', 'Ride-sharing'],
      tips: ['Use contactless payment', 'Download local transport apps', 'Keep change ready']
    };
  }

  private getMockAccommodationOptions(destination: string, isDomestic: boolean): any[] {
    return [
      { type: 'Budget', price: isDomestic ? '₹1,500/night' : this.formatForeignCurrency(30, destination) },
      { type: 'Mid-range', price: isDomestic ? '₹4,000/night' : this.formatForeignCurrency(80, destination) },
      { type: 'Luxury', price: isDomestic ? '₹10,000/night' : this.formatForeignCurrency(200, destination) }
    ];
  }

  private getMockAttractions(destination: string, isDomestic: boolean): any[] {
    return [
      { name: `Top attraction in ${destination}`, cost: isDomestic ? '₹500' : this.formatForeignCurrency(15, destination) },
      { name: `Cultural site in ${destination}`, cost: isDomestic ? '₹300' : this.formatForeignCurrency(10, destination) },
      { name: `Adventure activity in ${destination}`, cost: isDomestic ? '₹1,200' : this.formatForeignCurrency(40, destination) }
    ];
  }

  private getMockDiningOptions(destination: string, isDomestic: boolean): any[] {
    return [
      { type: 'Street Food', cost: isDomestic ? '₹200-500' : this.formatForeignCurrency(8, destination) },
      { type: 'Local Restaurant', cost: isDomestic ? '₹800-1,500' : this.formatForeignCurrency(25, destination) },
      { type: 'Fine Dining', cost: isDomestic ? '₹2,500-5,000' : this.formatForeignCurrency(60, destination) }
    ];
  }

  private getMockLocalCuisine(destination: string): string[] {
    const cuisineMap: Record<string, string[]> = {
      'dubai': ['Shawarma', 'Hummus', 'Dates', 'Arabic Coffee'],
      'thailand': ['Pad Thai', 'Tom Yum', 'Green Curry', 'Mango Sticky Rice'],
      'singapore': ['Hainanese Chicken Rice', 'Laksa', 'Satay', 'Kaya Toast'],
      'japan': ['Sushi', 'Ramen', 'Tempura', 'Wagyu Beef'],
      'default': ['Local specialties', 'Traditional dishes', 'Regional cuisine', 'Street food']
    };

    const key = destination.toLowerCase();
    for (const [dest, items] of Object.entries(cuisineMap)) {
      if (key.includes(dest)) return items;
    }
    return cuisineMap.default;
  }

  private getMockDietaryOptions(destination: string, isDomestic: boolean): any {
    return {
      vegetarian: isDomestic ? 'Widely available' : 'Available in most restaurants',
      vegan: isDomestic ? 'Common' : 'Limited but available',
      halal: isDomestic ? 'Available' : 'Check with restaurants',
      glutenFree: isDomestic ? 'Limited' : 'Available on request'
    };
  }

  // Simplified versions of other mock methods
  private getMockVisaRequirements(destination: string, isDomestic: boolean): any {
    return isDomestic ? { required: false, documents: ['Valid ID'] } : 
    { required: true, documents: ['Passport', 'Visa application', 'Photos', 'Bank statements'] };
  }

  private getMockVisaProcess(destination: string, isDomestic: boolean): any {
    return isDomestic ? null : { steps: ['Apply online', 'Submit documents', 'Pay fees', 'Wait for approval'] };
  }

  private getMockVisaFees(destination: string, isDomestic: boolean): any {
    return isDomestic ? null : { fee: this.formatForeignCurrency(50, destination), processing: '3-7 days' };
  }

  private getMockWeatherInfo(destination: string): any {
    return { climate: 'Varies by season', temperature: '15-30°C', rainfall: 'Moderate' };
  }

  private getMockPackingList(destination: string, season: string): string[] {
    return ['Comfortable clothes', 'Walking shoes', 'Sunscreen', 'Medicines', 'Power adapter'];
  }

  private getMockCulturalInfo(destination: string, isDomestic: boolean): string[] {
    return isDomestic ? ['Respect local customs', 'Dress modestly at religious places'] :
    ['Research local customs', 'Learn basic phrases', 'Respect cultural differences'];
  }

  private getMockEtiquette(destination: string, isDomestic: boolean): string[] {
    return ['Be polite', 'Remove shoes when required', 'Ask before photographing people'];
  }

  private getMockUsefulPhrases(destination: string, isDomestic: boolean): any {
    return { hello: 'Hello', thankyou: 'Thank you', help: 'Help', sorry: 'Sorry' };
  }

  private getMockEmbassyInfo(destination: string, isDomestic: boolean): any {
    return isDomestic ? null : { address: `Indian Embassy, ${destination}`, phone: '+123456789' };
  }

  private getMockEmergencyNumbers(destination: string, isDomestic: boolean): any {
    return isDomestic ? { police: '100', ambulance: '102', fire: '101' } :
    { police: '911', ambulance: '911', embassy: '+123456789' };
  }

  private getMockHospitals(destination: string, isDomestic: boolean): any[] {
    return [{ name: `General Hospital, ${destination}`, phone: '+123456789' }];
  }

  private getMockSafetyTips(destination: string, isDomestic: boolean): string[] {
    return ['Keep documents safe', 'Avoid isolated areas', 'Stay alert', 'Keep emergency contacts handy'];
  }

  private getMockShoppingInfo(destination: string, isDomestic: boolean): any[] {
    return [{ name: `Local Market, ${destination}`, specialty: 'Local crafts' }];
  }

  private getMockSouvenirs(destination: string): string[] {
    return ['Local handicrafts', 'Traditional items', 'Regional specialties'];
  }

  private getMockCustomsLimits(isDomestic: boolean): any {
    return isDomestic ? null : { dutyfree: '$800', restrictions: 'No food items' };
  }
}

// Export singleton instance
export const travelDeckGenerator = new TravelDeckGenerator();