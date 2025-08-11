// OpenRouter model configuration for different use cases
// Reference: https://openrouter.ai/models

export const OPENROUTER_MODELS = {
  // Best for vision/image analysis - Claude 3.5 Sonnet has excellent vision capabilities
  VISION: 'anthropic/claude-3.5-sonnet',
  
  // Best for detailed travel content generation - Claude 3.5 Sonnet for comprehensive output
  TRAVEL_CONTENT: 'anthropic/claude-3.5-sonnet',
  
  // Fast and cheaper for simple tasks - Claude 3 Haiku for quick responses
  QUICK_TASKS: 'anthropic/claude-3-haiku',
  
  // Alternative powerful models
  GPT4_VISION: 'openai/gpt-4-vision-preview',
  GPT4_TURBO: 'openai/gpt-4-turbo',
  
  // Fallback models
  FALLBACK: 'anthropic/claude-3-sonnet',
} as const;

export const MODEL_CONFIGS = {
  VISION_ANALYSIS: {
    model: OPENROUTER_MODELS.VISION,
    temperature: 0.3, // Lower for more accurate identification
    maxTokens: 1500,
    description: 'Optimized for image analysis and location identification'
  },
  
  TRAVEL_GENERATION: {
    model: OPENROUTER_MODELS.TRAVEL_CONTENT,
    temperature: 0.7, // Balanced for creativity and accuracy
    maxTokens: 8000, // Increased for comprehensive travel content
    description: 'Optimized for detailed travel planning and content generation'
  },
  
  QUICK_RESPONSE: {
    model: OPENROUTER_MODELS.QUICK_TASKS,
    temperature: 0.5,
    maxTokens: 1000,
    description: 'Fast responses for simple queries'
  }
};

// Card deck types for comprehensive travel planning
export const TRAVEL_DECK_TYPES = [
  'overview',      // Overall trip summary and highlights
  'itinerary',     // Day-by-day detailed itinerary
  'transport',     // Flights, trains, local transport
  'accommodation', // Hotels, hostels, stays
  'attractions',   // Places to visit, monuments, activities
  'dining',        // Restaurants, local food, dietary options
  'budget',        // Detailed budget breakdown
  'visa',          // Visa requirements and documentation
  'weather',       // Weather forecast and packing tips
  'culture',       // Cultural tips, dos and don'ts
  'emergency',     // Emergency contacts, medical, safety
  'shopping',      // Shopping areas, local markets, souvenirs
] as const;

export type TravelDeckType = typeof TRAVEL_DECK_TYPES[number];

// Model selection helper
export function getModelForTask(task: 'vision' | 'travel' | 'quick'): typeof MODEL_CONFIGS[keyof typeof MODEL_CONFIGS] {
  switch (task) {
    case 'vision':
      return MODEL_CONFIGS.VISION_ANALYSIS;
    case 'travel':
      return MODEL_CONFIGS.TRAVEL_GENERATION;
    case 'quick':
      return MODEL_CONFIGS.QUICK_RESPONSE;
    default:
      return MODEL_CONFIGS.QUICK_RESPONSE;
  }
}