'use client';
import React, { useState, useEffect } from 'react';
import { Camera, MessageSquare, MapPin, Clock, Send, X, Loader2 } from 'lucide-react';

interface QuickCaptureData {
  id: string;
  timestamp: Date;
  location?: {
    lat: number;
    lng: number;
    address?: string;
  };
  image?: string;
  note: string;
  tags: string[];
}

interface ScoutResponse {
  success: boolean;
  data?: any;
  error?: string;
}

const QuickCapture: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [note, setNote] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [location, setLocation] = useState<GeolocationPosition | null>(null);
  const [captures, setCaptures] = useState<QuickCaptureData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<ScoutResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get user's location on component mount
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => setLocation(position),
        (error) => console.log('Location access denied:', error)
      );
    }
    // Load saved captures from localStorage
    const savedCaptures = localStorage.getItem('quickCaptures');
    if (savedCaptures) {
      setCaptures(JSON.parse(savedCaptures));
    }
  }, []);

  const handleImageCapture = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setResponse(null);

    const newCapture: QuickCaptureData = {
      id: Date.now().toString(),
      timestamp: new Date(),
      location: location ? {
        lat: location.coords.latitude,
        lng: location.coords.longitude
      } : undefined,
      image: image || undefined,
      note: note.trim(),
      tags: note.match(/#\w+/g)?.map(tag => tag.substring(1)) || []
    };

    try {
      const apiResponse = await fetch('/api/scout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newCapture),
      });

      const result = await apiResponse.json();
      setResponse(result);

      if (apiResponse.ok && result.success) {
        // Save to localStorage and update captures list
        const updatedCaptures = [...captures, newCapture];
        setCaptures(updatedCaptures);
        localStorage.setItem('quickCaptures', JSON.stringify(updatedCaptures));
        
        // Reset form
        setNote('');
        setImage(null);
        setIsOpen(false);
      } else {
        setError(result.error || 'An error occurred while submitting the capture');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Network error occurred';
      setError(errorMessage);
      setResponse({ success: false, error: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">Quick Capture</h1>
          <button
            onClick={() => setIsOpen(true)}
            className="bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
          >
            <Camera className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Quick Capture Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">New Capture</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
                disabled={isLoading}
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image (optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageCapture}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  disabled={isLoading}
                />
                {image && (
                  <div className="mt-2">
                    <img
                      src={image}
                      alt="Captured"
                      className="w-full max-w-xs h-32 object-cover rounded-md"
                    />
                  </div>
                )}
              </div>

              {/* Note Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Note
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="What's happening? Use #tags to categorize..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isLoading}
                  required
                />
                <div className="mt-1 text-xs text-gray-500">
                  {note.match(/#\w+/g)?.length || 0} tags detected
                </div>
              </div>

              {/* Location Info */}
              {location && (
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="w-4 h-4 mr-1" />
                  Location will be included
                </div>
              )}

              {/* Error Display */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !note.trim()}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Capture
                  </>
                )}
              </button>
            </form>

            {/* API Response Preview */}
            {response && (
              <div className="border-t border-gray-200 p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-2">API Response:</h3>
                <div className="bg-gray-50 rounded-md p-3">
                  <pre className="text-xs text-gray-600 whitespace-pre-wrap overflow-x-auto">
                    {JSON.stringify(response, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Captures List */}
      <div className="p-4 space-y-4">
        {captures.length === 0 ? (
          <div className="text-center py-12">
            <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No captures yet</h3>
            <p className="text-gray-600">Tap the camera button to create your first quick capture</p>
          </div>
        ) : (
          captures.map((capture) => (
            <div key={capture.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="w-4 h-4 mr-1" />
                  {formatTimestamp(capture.timestamp)}
                  {capture.location && (
                    <>
                      <MapPin className="w-4 h-4 ml-3 mr-1" />
                      Location
                    </>
                  )}
                </div>
              </div>
              {capture.image && (
                <div className="mb-3">
                  <img
                    src={capture.image}
                    alt="Capture"
                    className="w-full max-w-sm h-48 object-cover rounded-md"
                  />
                </div>
              )}
              <div className="text-gray-900 whitespace-pre-wrap mb-2">{capture.note}</div>
              {capture.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {capture.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-block bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default QuickCapture;
