import { NextRequest, NextResponse } from 'next/server';
import { validateCompleteTravelInput } from '@/lib/validations/travel';
import { rapidAPIClient } from '@/lib/api/rapidapi';
import { travelDeckGenerator } from '@/lib/api/travel-deck-generator';
import { TravelCaptureInput } from '@/lib/types/travel';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting travel deck generation...');
    
    // Simply parse the request body without HMAC verification
    const travelData = await request.json();
    console.log('📝 Request data received:', { destination: travelData.destination });
    
    // Validate the travel input
    const validation = validateCompleteTravelInput(travelData);
    if (!validation.success) {
      console.error('❌ Validation failed:', validation.error?.issues);
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
    console.log('✅ Input validated successfully');
    
    // Add timeout wrapper for the entire generation process
    const GENERATION_TIMEOUT = 60000; // 60 seconds total timeout
    
    const generationPromise = Promise.race([
      // Main generation process
      (async () => {
        try {
          console.log('📡 Fetching travel data from RapidAPI...');
          // Set shorter timeout for API data fetch
          const apiDataPromise = Promise.race([
            rapidAPIClient.getTravelData(travelInput),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('RapidAPI timeout')), 15000)
            )
          ]);
          
          let apiData;
          try {
            apiData = await apiDataPromise;
            console.log('✅ RapidAPI data fetched successfully');
          } catch (apiError) {
            console.warn('⚠️ RapidAPI failed, using fallback data:', apiError);
            apiData = {}; // Use empty data as fallback
          }
          
          console.log('🤖 Generating travel deck with AI...');
          const deck = await travelDeckGenerator.generateCompleteDeck(travelInput, apiData);
          console.log('✅ Travel deck generated successfully');
          
          return deck;
        } catch (error) {
          console.error('❌ Generation process error:', error);
          throw error;
        }
      })(),
      
      // Timeout promise
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Generation timeout - process took too long')), GENERATION_TIMEOUT)
      )
    ]);

    const deck = await generationPromise;
    
    // Return the deck
    return NextResponse.json({
      success: true,
      deck,
      message: `Travel deck created with ${deck.cards.length} cards`,
      metadata: {
        deckId: deck.id,
        destination: deck.destination,
        cardCount: deck.cards.length,
        generatedAt: deck.createdAt
      }
    });

  } catch (error) {
    console.error('Travel deck creation error:', error);
    
    // Return more specific error messages
    let errorMessage = 'Failed to create travel deck';
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        errorMessage = 'Request timeout - please try again with a simpler destination';
      } else if (error.message.includes('RapidAPI')) {
        errorMessage = 'Travel data service temporarily unavailable - trying with limited data';
      }
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    endpoint: '/api/scout/deck',
    description: 'Generate comprehensive travel deck with multiple card types',
    cardTypes: [
      'overview',
      'itinerary', 
      'transport',
      'accommodation',
      'attractions',
      'dining',
      'budget',
      'visa',
      'weather',
      'culture',
      'emergency',
      'shopping'
    ],
    models: {
      vision: 'Claude 3.5 Sonnet (for image analysis)',
      content: 'Claude 3.5 Sonnet (for travel content generation)'
    }
  });
}