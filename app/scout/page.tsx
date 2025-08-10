'use client';

import React, { useState, useEffect } from 'react';
import { Camera, MessageSquare, MapPin, Clock, Send, X } from 'lucide-react';

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

const QuickCapture: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [note, setNote] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [location, setLocation] = useState<GeolocationPosition | null>(null);
  const [captures, setCaptures] = useState<QuickCaptureData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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

    const newCapture: QuickCaptureData = {
      id: Date.now().toString(),
      timestamp: new Date(),
      location: location ? {
        lat: location.coords.latitude,
        lng: location.coords.longitude
      } : undefined,
      image,
      note,
      tags: note.match(/#\w+/g) || []
    };

    const updatedCaptures = [newCapture, ...captures];
    setCaptures(updatedCaptures);
    localStorage.setItem('quickCaptures', JSON.stringify(updatedCaptures));

    // Reset form
    setNote('');
    setImage(null);
    setIsOpen(false);
    setIsLoading(false);
  };

  const formatTimestamp = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Quick Capture v1.1</h1>
        
        {/* Quick Capture Button */}
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={() => setIsOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-colors"
          >
            <Camera className="w-6 h-6" />
          </button>
        </div>

        {/* Capture Modal */}
        {isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Quick Capture</h2>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Image Capture */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Photo (optional)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleImageCapture}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {image && (
                      <div className="mt-2">
                        <img
                          src={image}
                          alt="Captured"
                          className="w-full h-32 object-cover rounded-md"
                        />
                        <button
                          type="button"
                          onClick={() => setImage(null)}
                          className="mt-1 text-sm text-red-600 hover:text-red-800"
                        >
                          Remove image
                        </button>
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
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                      rows={4}
                      required
                    />
                  </div>

                  {/* Location Status */}
                  {location && (
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mr-1" />
                      Location captured
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading || !note.trim()}
                    className="w-full flex items-center justify-center py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-md transition-colors"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Capture
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Captures List */}
        <div className="space-y-4">
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
    </div>
  );
};

export default QuickCapture;
