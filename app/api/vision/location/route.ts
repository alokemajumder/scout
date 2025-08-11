import { NextRequest, NextResponse } from 'next/server';
import { visionLocationService } from '@/lib/api/vision';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageBase64, context } = body;

    if (!imageBase64) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Image data is required' 
        },
        { status: 400 }
      );
    }

    console.log('Processing vision-based location identification...');

    // Use enhanced identification with context if provided
    const result = context 
      ? await visionLocationService.identifyWithContext(imageBase64, context)
      : await visionLocationService.identifyLocationFromImage(imageBase64);

    if (result.success && result.location) {
      console.log('Location identified successfully:', result.location.location);
      
      return NextResponse.json({
        success: true,
        location: result.location,
        confidence: result.location.confidence,
        message: 'Location identified successfully'
      });
    } else {
      console.log('Location identification failed:', result.error);
      
      return NextResponse.json({
        success: false,
        error: result.error || 'Unable to identify location from image',
        message: 'Could not determine location from the provided image'
      }, { status: 422 });
    }

  } catch (error) {
    console.error('Vision location API error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        message: 'An error occurred while processing the image'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Return service status
  const status = visionLocationService.getStatus();
  
  return NextResponse.json({
    success: true,
    status: {
      visionSupported: status.available,
      provider: status.provider,
      endpoint: '/api/vision/location',
      methods: ['POST'],
      description: 'Upload an image to identify location using AI vision'
    }
  });
}