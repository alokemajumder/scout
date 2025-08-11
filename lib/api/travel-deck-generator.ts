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
    // Return basic mock content based on card type
    const mockContents: Record<string, any> = {
      overview: {
        destination: input.destination,
        country: 'India',
        duration: input.duration,
        travelType: input.travelType,
        highlights: ['Culture', 'Food', 'Heritage'],
        bestTime: 'October to March',
        currency: 'INR',
        languages: ['Hindi', 'English'],
        quickTips: ['Carry cash', 'Book in advance', 'Check weather']
      },
      budget: {
        currency: 'INR',
        totalBudget: { tight: 30000, comfortable: 60000, luxury: 120000 },
        perPerson: { tight: 15000, comfortable: 30000, luxury: 60000 },
        breakdown: {
          accommodation: 15000,
          transportation: 10000,
          food: 8000,
          attractions: 5000,
          shopping: 5000,
          miscellaneous: 2000
        },
        dailyAverage: 5000,
        savingTips: ['Book early', 'Use public transport', 'Eat local'],
        paymentMethods: ['Cash', 'UPI', 'Cards'],
        tippingGuide: '10% at restaurants, ₹20-50 for services'
      }
    };
    
    return mockContents[cardType] || { message: 'Content will be generated soon' };
  }
}

// Export singleton instance
export const travelDeckGenerator = new TravelDeckGenerator();