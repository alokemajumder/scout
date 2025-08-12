'use client';

import React, { useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Zap, Globe, Sparkles, MapPin, Users, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SafeThemeToggle } from '@/components/ui/safe-theme-toggle';
import { PublicCardsGrid } from '@/components/travel/PublicCardsGrid';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import { PublicTravelCard } from '@/lib/types/travel';

const HomePage = React.memo(() => {
  const router = useRouter();
  const { isMobile } = useDeviceDetection();

  const handleCardClick = useCallback((card: PublicTravelCard) => {
    // Navigate to a detailed view or just show a preview
    console.log('Clicked card:', card);
    // For now, redirect to scout page since that's where the functionality is
    router.push('/scout');
  }, [router]);

  const handleCreateJourney = useCallback(() => {
    router.push('/scout');
  }, [router]);

  const features = useMemo(() => [
    {
      icon: <MapPin className="w-8 h-8" />,
      title: 'AI-Powered Planning',
      description: 'Get personalized travel recommendations based on your preferences and budget.',
      gradient: 'from-web3-violet-500 to-web3-purple-500'
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: 'Community Driven',
      description: 'Discover hidden gems and authentic experiences shared by fellow travelers.',
      gradient: 'from-web3-purple-500 to-web3-pink-500'
    },
    {
      icon: <Heart className="w-8 h-8" />,
      title: 'Share & Inspire',
      description: 'Create and share your own travel guides to help others discover amazing places.',
      gradient: 'from-web3-pink-500 to-web3-violet-500'
    }
  ], []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-black transition-colors duration-300">
      {/* Web3 Mesh Background */}
      <div className="fixed inset-0 bg-web3-mesh dark:bg-web3-mesh-dark opacity-20 dark:opacity-10 pointer-events-none" />
      
      {/* Header */}
      <div className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg border-b border-gray-200 dark:border-gray-800 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-web3-violet-500 to-web3-purple-500 flex items-center justify-center shadow-neon">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-web3-violet-600 to-web3-purple-600 dark:from-web3-violet-400 dark:to-web3-pink-400 bg-clip-text text-transparent">Scout Travel</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">AI-Powered Journey Planning</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <SafeThemeToggle />
            <Button
              onClick={handleCreateJourney}
              className="bg-gradient-to-r from-web3-violet-600 to-web3-purple-600 hover:from-web3-violet-500 hover:to-web3-purple-500 text-white px-6 py-2 rounded-xl shadow-web3 hover:shadow-neon transition-all duration-300 flex items-center space-x-2 border border-white/20"
            >
              {isMobile ? <Camera className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
              <span className="font-semibold">{isMobile ? 'Snap & Go' : 'Create Journey'}</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center space-y-8 mb-16">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold">
              <span className="bg-gradient-to-r from-web3-violet-600 via-web3-purple-600 to-web3-pink-600 dark:from-web3-violet-400 dark:via-web3-purple-400 dark:to-web3-pink-400 bg-clip-text text-transparent">
                Discover Amazing
              </span>
              <br />
              <span className="text-gray-900 dark:text-white">
                Travel Experiences
              </span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Explore AI-powered travel guides created by our community. Get inspired, plan your journey, and share your own adventures.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              onClick={handleCreateJourney}
              size="lg"
              className="bg-gradient-to-r from-web3-violet-600 to-web3-purple-600 hover:from-web3-violet-500 hover:to-web3-purple-500 text-white px-8 py-3 rounded-xl shadow-web3 hover:shadow-neon transition-all duration-300 flex items-center space-x-2 border-0"
            >
              <Sparkles className="w-5 h-5" />
              <span className="font-semibold">Create Your Journey</span>
            </Button>
            <Button
              onClick={() => document.getElementById('public-cards')?.scrollIntoView({ behavior: 'smooth' })}
              variant="outline"
              size="lg"
              className="border-web3-violet-300 dark:border-web3-violet-700 text-web3-violet-700 dark:text-web3-violet-400 hover:bg-web3-violet-50 dark:hover:bg-web3-violet-900/20 px-8 py-3 rounded-xl transition-all duration-300"
            >
              Explore Guides
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <Card key={index} className="p-6 glass dark:glass-dark border-web3-violet-200 dark:border-web3-violet-800/30 shadow-web3 hover:shadow-neon transition-all duration-300">
              <div className="space-y-4">
                <div className={`w-16 h-16 rounded-xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center text-white shadow-neon`}>
                  {feature.icon}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {feature.description}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Public Cards Section */}
        <div id="public-cards">
          <PublicCardsGrid onCardClick={handleCardClick} />
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <Card className="p-12 glass dark:glass-dark border-web3-violet-200 dark:border-web3-violet-800/30 shadow-web3">
            <div className="space-y-6">
              <div className="w-20 h-20 bg-gradient-to-r from-web3-violet-500 to-web3-purple-500 rounded-full flex items-center justify-center mx-auto shadow-neon">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-web3-violet-600 to-web3-purple-600 dark:from-web3-violet-400 dark:to-web3-pink-400 bg-clip-text text-transparent mb-4">
                  Ready to Start Your Adventure?
                </h2>
                <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
                  Join thousands of travelers who use Scout to plan unforgettable journeys. Create your first travel guide today!
                </p>
              </div>
              <Button
                onClick={handleCreateJourney}
                size="lg"
                className="bg-gradient-to-r from-web3-violet-600 to-web3-purple-600 hover:from-web3-violet-500 hover:to-web3-purple-500 text-white px-12 py-4 rounded-xl shadow-web3 hover:shadow-neon transition-all duration-300 flex items-center space-x-3 mx-auto border-0"
              >
                <Zap className="w-6 h-6" />
                <span className="font-semibold text-lg">Start Planning Now</span>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
});

HomePage.displayName = 'HomePage';

export default HomePage;